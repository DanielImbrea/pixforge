'use client';

import type { BlurCustomAction, BlurFacesParams, BlurStrength } from '@/lib/tools/blur-faces-params';
import { blurStrengthToRadius } from '@/lib/tools/blur-faces-params';
import { FaceBlurError } from '@/lib/image/face-blur-error';

const MODEL_URL = '/face-api-models';
const MATCH_MIN_CONFIDENCE = 0.15;
const MAX_FACE_DETECT_EDGE = 1600;
const FACE_MATCH_THRESHOLD = 0.55;

type InitMode = 'detect' | 'full';
type FaceApiModule = typeof import('@vladmandic/face-api');
type DetectorOptions = InstanceType<FaceApiModule['SsdMobilenetv1Options']>;
type FaceBox = { x: number; y: number; width: number; height: number };
type DetectedFace = { box: FaceBox; descriptor: Float32Array };

let initPromise: Partial<Record<InitMode, Promise<void>>> = {};
let faceapi: FaceApiModule | null = null;
let detectorOptions: DetectorOptions | null = null;
let loadedMode: InitMode | null = null;

function shouldBlurFace(isMatch: boolean, customAction: BlurCustomAction): boolean {
  return customAction === 'blur' ? isMatch : !isMatch;
}

function expandBox(
  box: { x: number; y: number; width: number; height: number },
  imageWidth: number,
  imageHeight: number,
  detectionScale = 1
): { left: number; top: number; width: number; height: number } {
  const invScale = detectionScale > 0 ? 1 / detectionScale : 1;
  const scaled = {
    x: box.x * invScale,
    y: box.y * invScale,
    width: box.width * invScale,
    height: box.height * invScale,
  };
  const padX = Math.round(scaled.width * 0.18);
  const padY = Math.round(scaled.height * 0.22);
  const left = Math.max(0, Math.round(scaled.x - padX));
  const top = Math.max(0, Math.round(scaled.y - padY));
  const width = Math.min(imageWidth - left, Math.round(scaled.width + padX * 2));
  const height = Math.min(imageHeight - top, Math.round(scaled.height + padY * 2));
  return { left, top, width: Math.max(1, width), height: Math.max(1, height) };
}

async function loadFaceApiModule(): Promise<FaceApiModule> {
  if (faceapi) return faceapi;
  faceapi = await import('@vladmandic/face-api');
  return faceapi;
}

async function ensureFaceApiReady(mode: InitMode): Promise<void> {
  if (!initPromise[mode]) {
    initPromise[mode] = (async () => {
      const api = await loadFaceApiModule();

      if (!loadedMode) {
        await api.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        loadedMode = 'detect';
        if (mode === 'full') {
          await api.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
          await api.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
          loadedMode = 'full';
        }
      } else if (loadedMode === 'detect' && mode === 'full') {
        await api.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await api.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        loadedMode = 'full';
      }

      if (!detectorOptions) {
        detectorOptions = new api.SsdMobilenetv1Options({
          minConfidence: MATCH_MIN_CONFIDENCE,
          maxResults: 20,
        });
      }
    })().catch((err) => {
      initPromise[mode] = undefined;
      throw err;
    });
  }

  return initPromise[mode]!;
}

async function loadBitmapFromFile(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        createImageBitmap(img)
          .then(resolve)
          .catch(reject);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image.'));
      };
      img.src = url;
    });
  }
}

async function bitmapToCanvas(bitmap: ImageBitmap): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new FaceBlurError('canvas unavailable', 'Face detection failed.');
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return canvas;
}

function prepareDetectionCanvas(sourceCanvas: HTMLCanvasElement): {
  canvas: HTMLCanvasElement;
  scale: number;
} {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const longEdge = Math.max(width, height);
  const scale = longEdge > MAX_FACE_DETECT_EDGE ? MAX_FACE_DETECT_EDGE / longEdge : 1;
  if (scale >= 1) {
    return { canvas: sourceCanvas, scale: 1 };
  }

  const scaled = document.createElement('canvas');
  scaled.width = Math.max(1, Math.round(width * scale));
  scaled.height = Math.max(1, Math.round(height * scale));
  const ctx = scaled.getContext('2d');
  if (!ctx) {
    return { canvas: sourceCanvas, scale: 1 };
  }
  ctx.drawImage(sourceCanvas, 0, 0, scaled.width, scaled.height);
  return { canvas: scaled, scale };
}

function blurCanvasRegion(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  region: { left: number; top: number; width: number; height: number },
  blurPx: number
): void {
  const { left, top, width, height } = region;
  const patch = document.createElement('canvas');
  patch.width = width;
  patch.height = height;
  const pctx = patch.getContext('2d');
  if (!pctx) return;

  pctx.drawImage(canvas, left, top, width, height, 0, 0, width, height);
  pctx.filter = `blur(${blurPx}px)`;
  pctx.drawImage(patch, 0, 0);
  ctx.drawImage(patch, left, top);
}

async function detectFaceBoxes(canvas: HTMLCanvasElement): Promise<FaceBox[]> {
  const api = await loadFaceApiModule();
  if (!detectorOptions) {
    throw new FaceBlurError('detector not ready', 'Face detection failed.');
  }

  const { canvas: detectCanvas } = prepareDetectionCanvas(canvas);
  const detections = await api.detectAllFaces(detectCanvas, detectorOptions);
  if (detectCanvas === canvas) {
    return detections.map((detection) => ({
      x: detection.box.x,
      y: detection.box.y,
      width: detection.box.width,
      height: detection.box.height,
    }));
  }

  const scaleX = canvas.width / detectCanvas.width;
  const scaleY = canvas.height / detectCanvas.height;
  return detections.map((detection) => ({
    x: detection.box.x * scaleX,
    y: detection.box.y * scaleY,
    width: detection.box.width * scaleX,
    height: detection.box.height * scaleY,
  }));
}

async function detectFacesWithDescriptors(canvas: HTMLCanvasElement): Promise<DetectedFace[]> {
  const api = await loadFaceApiModule();
  if (!detectorOptions) {
    throw new FaceBlurError('detector not ready', 'Face detection failed.');
  }

  const { canvas: detectCanvas } = prepareDetectionCanvas(canvas);
  const faces = await api
    .detectAllFaces(detectCanvas, detectorOptions)
    .withFaceLandmarks()
    .withFaceDescriptors();

  const scaleX = canvas.width / detectCanvas.width;
  const scaleY = canvas.height / detectCanvas.height;
  return faces.map((face) => ({
    descriptor: face.descriptor,
    box:
      detectCanvas === canvas
        ? {
            x: face.detection.box.x,
            y: face.detection.box.y,
            width: face.detection.box.width,
            height: face.detection.box.height,
          }
        : {
            x: face.detection.box.x * scaleX,
            y: face.detection.box.y * scaleY,
            width: face.detection.box.width * scaleX,
            height: face.detection.box.height * scaleY,
          },
  }));
}

function getPrimaryFaceDescriptor(faces: DetectedFace[]): Float32Array | null {
  if (faces.length === 0) return null;
  if (faces.length === 1) return faces[0].descriptor;

  const largest = faces.reduce((best, current) => {
    const bestArea = best.box.width * best.box.height;
    const currentArea = current.box.width * current.box.height;
    return currentArea > bestArea ? current : best;
  });

  return largest.descriptor;
}

async function canvasToFile(canvas: HTMLCanvasElement, originalFile: File): Promise<File> {
  const type =
    originalFile.type === 'image/png' || originalFile.type === 'image/webp'
      ? originalFile.type
      : 'image/jpeg';
  const quality = type === 'image/jpeg' ? 0.92 : undefined;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => {
        if (value) resolve(value);
        else reject(new FaceBlurError('export failed', 'Face detection failed.'));
      },
      type,
      quality
    );
  });

  const extension =
    type === 'image/png' ? '.png' : type === 'image/webp' ? '.webp' : '.jpg';
  const baseName = originalFile.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${baseName}${extension}`, { type });
}

async function applyAutomaticBlur(
  canvas: HTMLCanvasElement,
  blurStrength: BlurStrength
): Promise<number> {
  await ensureFaceApiReady('detect');
  const detections = await detectFaceBoxes(canvas);
  if (detections.length === 0) {
    throw new FaceBlurError(
      'no faces in image',
      'No faces were detected in the uploaded photo.',
      'blurFacesErrorNoFacesInImage'
    );
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new FaceBlurError('canvas unavailable', 'Face detection failed.');
  }

  const blurPx = blurStrengthToRadius(blurStrength);
  for (const box of detections) {
    const region = expandBox(box, canvas.width, canvas.height, 1);
    blurCanvasRegion(ctx, canvas, region, blurPx);
  }

  return detections.length;
}

async function applyCustomBlur(
  canvas: HTMLCanvasElement,
  referenceFile: File,
  blurStrength: BlurStrength,
  customAction: BlurCustomAction
): Promise<number> {
  await ensureFaceApiReady('full');
  const api = await loadFaceApiModule();

  const referenceBitmap = await loadBitmapFromFile(referenceFile);
  const referenceCanvas = await bitmapToCanvas(referenceBitmap);
  const referenceFaces = await detectFacesWithDescriptors(referenceCanvas);
  const referenceDescriptor = getPrimaryFaceDescriptor(referenceFaces);
  if (!referenceDescriptor) {
    throw new FaceBlurError(
      'reference face missing',
      'No face found in the reference portrait. Upload a clear, front-facing photo of the face.',
      'blurFacesErrorNoFaceInPortrait'
    );
  }

  const faces = await detectFacesWithDescriptors(canvas);
  if (faces.length === 0) {
    throw new FaceBlurError(
      'no faces in image',
      'No faces were detected in the uploaded photo.',
      'blurFacesErrorNoFacesInImage'
    );
  }

  const facesToBlur = faces.filter((face) => {
    const distance = api.euclideanDistance(referenceDescriptor, face.descriptor);
    const isMatch = distance < FACE_MATCH_THRESHOLD;
    return shouldBlurFace(isMatch, customAction);
  });

  if (facesToBlur.length === 0) {
    throw new FaceBlurError(
      'no faces matched selection',
      'No matching face was found in the photo. Try a clearer reference portrait or crop closer to the face.',
      'blurFacesErrorNoMatch'
    );
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new FaceBlurError('canvas unavailable', 'Face detection failed.');
  }

  const blurPx = blurStrengthToRadius(blurStrength);
  for (const face of facesToBlur) {
    const region = expandBox(face.box, canvas.width, canvas.height, 1);
    blurCanvasRegion(ctx, canvas, region, blurPx);
  }

  return facesToBlur.length;
}

export async function blurFacesInBrowser(
  file: File,
  params: BlurFacesParams,
  referenceFile?: File | null
): Promise<{ file: File; blurredFaceCount: number }> {
  try {
    const bitmap = await loadBitmapFromFile(file);
    const canvas = await bitmapToCanvas(bitmap);

    let blurredFaceCount: number;
    if (params.detectionMode === 'custom') {
      if (!referenceFile) {
        throw new FaceBlurError(
          'reference missing',
          'Reference portrait is required for custom detection.',
          'blurFacesErrorDetectionFailed'
        );
      }
      blurredFaceCount = await applyCustomBlur(
        canvas,
        referenceFile,
        params.blurStrength,
        params.customAction
      );
    } else {
      blurredFaceCount = await applyAutomaticBlur(canvas, params.blurStrength);
    }

    const outputFile = await canvasToFile(canvas, file);
    return { file: outputFile, blurredFaceCount };
  } catch (err) {
    if (err instanceof FaceBlurError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new FaceBlurError(message, 'Face detection failed.', 'blurFacesErrorDetectionFailed');
  }
}

export { FaceBlurError };
