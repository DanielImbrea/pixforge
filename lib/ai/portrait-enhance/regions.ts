import sharp from 'sharp';
import type { PortraitFeatureKey, RegionalMaskSet } from '@/lib/ai/portrait-enhance/types';
import type { FaceLandmarkPoint } from '@/lib/ai/portrait-enhance/types';

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function scalePoint(p: FaceLandmarkPoint, invScale: number): FaceLandmarkPoint {
  return { x: p.x * invScale, y: p.y * invScale };
}

function toLocal(points: FaceLandmarkPoint[], left: number, top: number): FaceLandmarkPoint[] {
  return points.map((p) => ({ x: p.x - left, y: p.y - top }));
}

function polygonSvg(points: FaceLandmarkPoint[], width: number, height: number): string {
  if (points.length < 3) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="black"/></svg>`;
  }
  const pts = points.map((p) => `${clamp(p.x, 0, width - 1)},${clamp(p.y, 0, height - 1)}`).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="black"/>
    <polygon points="${pts}" fill="white"/>
  </svg>`;
}

async function rasterMask(
  points: FaceLandmarkPoint[],
  width: number,
  height: number,
  feather: number
): Promise<Buffer> {
  const svg = polygonSvg(points, width, height);
  return sharp(Buffer.from(svg))
    .blur(Math.max(2, feather))
    .greyscale()
    .png()
    .toBuffer();
}

function pickLandmarks(landmarks: FaceLandmarkPoint[], indices: number[]): FaceLandmarkPoint[] {
  return indices.map((i) => landmarks[i]).filter(Boolean);
}

function expandPolygon(points: FaceLandmarkPoint[], cx: number, cy: number, factor: number): FaceLandmarkPoint[] {
  return points.map((p) => ({
    x: cx + (p.x - cx) * factor,
    y: cy + (p.y - cy) * factor,
  }));
}

function bboxCenter(points: FaceLandmarkPoint[]): { x: number; y: number } {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
}

const JAW = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const LEFT_BROW = [17, 18, 19, 20, 21];
const RIGHT_BROW = [22, 23, 24, 25, 26];
const NOSE_BRIDGE = [27, 28, 29];
const LEFT_EYE = [36, 37, 38, 39, 40, 41];
const RIGHT_EYE = [42, 43, 44, 45, 46, 47];
const OUTER_LIPS = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59];
const INNER_LIPS = [60, 61, 62, 63, 64, 65, 66, 67];

export function expandFaceCropFromLandmarks(
  landmarks: FaceLandmarkPoint[],
  imageWidth: number,
  imageHeight: number
): { left: number; top: number; width: number; height: number } {
  const xs = landmarks.map((p) => p.x);
  const ys = landmarks.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const boxW = maxX - minX;
  const boxH = maxY - minY;

  const padX = Math.round(boxW * 0.22);
  const padTop = Math.round(boxH * 0.28);
  const padBottom = Math.round(boxH * 0.18);

  const left = clamp(Math.floor(minX - padX), 0, imageWidth - 1);
  const top = clamp(Math.floor(minY - padTop), 0, imageHeight - 1);
  const right = clamp(Math.ceil(maxX + padX), left + 1, imageWidth);
  const bottom = clamp(Math.ceil(maxY + padBottom), top + 1, imageHeight);

  return { left, top, width: right - left, height: bottom - top };
}

export async function buildRegionalMasks(
  landmarks: FaceLandmarkPoint[],
  cropWidth: number,
  cropHeight: number,
  cropLeft: number,
  cropTop: number
): Promise<RegionalMaskSet> {
  const local = toLocal(landmarks, cropLeft, cropTop);
  const feather = Math.max(3, Math.round(Math.min(cropWidth, cropHeight) * 0.025));

  const jaw = pickLandmarks(local, JAW);
  const leftBrow = pickLandmarks(local, LEFT_BROW);
  const rightBrow = pickLandmarks(local, RIGHT_BROW);
  const noseBridge = pickLandmarks(local, NOSE_BRIDGE);
  const leftEye = pickLandmarks(local, LEFT_EYE);
  const rightEye = pickLandmarks(local, RIGHT_EYE);
  const outerLips = pickLandmarks(local, OUTER_LIPS);
  const innerLips = pickLandmarks(local, INNER_LIPS);

  const foreheadY = Math.min(...leftBrow.map((p) => p.y), ...rightBrow.map((p) => p.y));
  const foreheadBand = [
    { x: jaw[0].x, y: foreheadY - cropHeight * 0.06 },
    { x: jaw[16].x, y: foreheadY - cropHeight * 0.06 },
    ...noseBridge.slice(0, 2).reverse(),
    ...leftBrow.slice().reverse(),
    ...rightBrow,
  ];

  const faceHull = [...jaw, ...foreheadBand];
  const leftEyeCenter = bboxCenter(leftEye);
  const rightEyeCenter = bboxCenter(rightEye);
  const leftEyeMask = expandPolygon(leftEye, leftEyeCenter.x, leftEyeCenter.y, 1.35);
  const rightEyeMask = expandPolygon(rightEye, rightEyeCenter.x, rightEyeCenter.y, 1.35);
  const eyesPoints = [...leftEyeMask, ...rightEyeMask];

  const lipsMask = expandPolygon(outerLips, bboxCenter(outerLips).x, bboxCenter(outerLips).y, 1.08);

  const underLeft = leftEye.map((p) => ({ x: p.x, y: p.y + (bboxCenter(jaw).y - p.y) * 0.12 }));
  const underRight = rightEye.map((p) => ({ x: p.x, y: p.y + (bboxCenter(jaw).y - p.y) * 0.12 }));
  const underEyePoints = [
    ...underLeft,
    ...underRight.map((p) => ({ x: p.x, y: p.y + cropHeight * 0.04 })),
    ...underLeft
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + cropHeight * 0.04 })),
  ];

  const teethCenter = bboxCenter(innerLips);
  const teethPoints = innerLips
    .filter((p) => p.y >= teethCenter.y - 2)
    .concat(innerLips.filter((p) => p.y < teethCenter.y).slice(0, 2));

  const [face, skin, eyes, lips, teeth, underEye, lighting] = await Promise.all([
    rasterMask(faceHull, cropWidth, cropHeight, feather * 1.2),
    rasterMask(faceHull, cropWidth, cropHeight, feather * 1.4),
    rasterMask(eyesPoints, cropWidth, cropHeight, feather * 0.7),
    rasterMask(lipsMask, cropWidth, cropHeight, feather * 0.8),
    teethPoints.length >= 3
      ? rasterMask(teethPoints, cropWidth, cropHeight, feather * 0.6)
      : rasterMask([], cropWidth, cropHeight, feather),
    rasterMask(underEyePoints, cropWidth, cropHeight, feather * 1.1),
    rasterMask(faceHull, cropWidth, cropHeight, feather * 2),
  ]);

  return { face, skin, eyes, lips, teeth, underEye, lighting };
}

export const FEATURE_ORDER: PortraitFeatureKey[] = [
  'lighting',
  'skin',
  'underEye',
  'teeth',
  'lips',
  'eyes',
];
