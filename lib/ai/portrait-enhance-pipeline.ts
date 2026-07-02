import sharp from 'sharp';
import { requireReplicateToken } from '@/lib/ai/config';
import { fetchImageBuffer } from '@/lib/ai/fetch-image';
import { extractReplicateOutputUrl, resolveReplicateVersion } from '@/lib/ai/replicate-client';
import type { PortraitEnhanceRouting } from '@/lib/ai/portrait-enhance-routing';
import type { PortraitEnhanceStyle } from '@/lib/tools/portrait-enhance-params';
import { createSignedUrl, deleteFromStorage, uploadBufferToStorage } from '@/lib/supabase/storage';
import type { ReplicatePrediction } from '@/lib/ai/replicate-client';
import { applyMockPortraitEnhance } from '@/lib/ai/portrait-enhance-process';

const REPLICATE_API = 'https://api.replicate.com/v1';
const MAX_FACES = 4;
const MIN_FACE_AREA_RATIO = 0.015;

type FaceRegion = { left: number; top: number; width: number; height: number };

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function normalizeStyle(style: PortraitEnhanceStyle): 'natural' | 'glamour' {
  return style === 'glamour' ? 'glamour' : 'natural';
}

function getBlendStrength(style: PortraitEnhanceStyle): number {
  return normalizeStyle(style) === 'glamour' ? 0.84 : 0.72;
}

function getMaskInset(style: PortraitEnhanceStyle, side: number): number {
  return Math.max(12, Math.round(side * (normalizeStyle(style) === 'glamour' ? 0.1 : 0.12)));
}

function getFeatherSigma(style: PortraitEnhanceStyle, side: number): number {
  return Math.max(10, Math.round(side * (normalizeStyle(style) === 'glamour' ? 0.08 : 0.1)));
}

function expandFaceRegion(
  box: { x: number; y: number; width: number; height: number },
  imageWidth: number,
  imageHeight: number,
  detectionScale = 1
): FaceRegion {
  const invScale = detectionScale > 0 ? 1 / detectionScale : 1;
  const scaled = {
    x: box.x * invScale,
    y: box.y * invScale,
    width: box.width * invScale,
    height: box.height * invScale,
  };

  const padX = Math.round(scaled.width * 0.28);
  const padTop = Math.round(scaled.height * 0.38);
  const padBottom = Math.round(scaled.height * 0.24);

  const left = clamp(Math.round(scaled.x - padX), 0, imageWidth - 1);
  const top = clamp(Math.round(scaled.y - padTop), 0, imageHeight - 1);
  const right = clamp(Math.round(scaled.x + scaled.width + padX), left + 1, imageWidth);
  const bottom = clamp(Math.round(scaled.y + scaled.height + padBottom), top + 1, imageHeight);

  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}

function selectFaceRegions(
  detections: Array<{ box: { x: number; y: number; width: number; height: number } }>,
  imageWidth: number,
  imageHeight: number,
  detectionScale: number
): FaceRegion[] {
  const imageArea = imageWidth * imageHeight;
  return detections
    .map((detection) => ({
      region: expandFaceRegion(detection.box, imageWidth, imageHeight, detectionScale),
      areaRatio: (detection.box.width * detection.box.height) / Math.max(1, imageArea * detectionScale * detectionScale),
    }))
    .filter((item) => item.areaRatio >= MIN_FACE_AREA_RATIO)
    .sort((a, b) => b.region.width * b.region.height - a.region.width * a.region.height)
    .slice(0, MAX_FACES)
    .map((item) => item.region);
}

async function uploadTempImage(buffer: Buffer, userId: string): Promise<{ path: string; signedUrl: string }> {
  const { storagePath } = await uploadBufferToStorage(buffer, 'uploads', userId, 'image/png');
  const signedUrl = await createSignedUrl('uploads', storagePath, 900);
  return { path: storagePath, signedUrl };
}

async function runCodeformerOnCrop(
  cropBuffer: Buffer,
  userId: string,
  routing: PortraitEnhanceRouting
): Promise<Buffer> {
  const token = requireReplicateToken();
  const version = await resolveReplicateVersion(routing.model, token, {
    toolCategory: 'portrait_enhance',
  });
  const versionId = version.includes(':') ? version.split(':')[1] : version;
  const temp = await uploadTempImage(cropBuffer, userId);

  try {
    const res = await fetch(`${REPLICATE_API}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=120',
      },
      body: JSON.stringify({
        version: versionId,
        input: {
          image: temp.signedUrl,
          codeformer_fidelity: routing.codeformerFidelity,
          background_enhance: false,
          face_upsample: false,
          upscale: 1,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Portrait enhancement failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const prediction = (await res.json()) as ReplicatePrediction;
    if (prediction.status !== 'succeeded') {
      throw new Error(prediction.error || 'Portrait enhancement did not complete.');
    }

    const outputUrl = extractReplicateOutputUrl(prediction.output);
    if (!outputUrl) {
      throw new Error('Portrait enhancement returned no image.');
    }

    const { buffer } = await fetchImageBuffer(outputUrl);
    return buffer;
  } finally {
    await deleteFromStorage('uploads', temp.path).catch(() => undefined);
  }
}

async function enhanceCrop(
  cropBuffer: Buffer,
  userId: string,
  routing: PortraitEnhanceRouting,
  provider: 'replicate' | 'mock'
): Promise<Buffer> {
  if (provider === 'mock') {
    return applyMockPortraitEnhance(cropBuffer, normalizeStyle(routing.enhanceStyle));
  }
  return runCodeformerOnCrop(cropBuffer, userId, routing);
}

async function createFeatherMask(
  width: number,
  height: number,
  style: PortraitEnhanceStyle
): Promise<Buffer> {
  const insetX = getMaskInset(style, width);
  const insetY = getMaskInset(style, height);
  const blendStrength = getBlendStrength(style);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="black"/>
      <rect
        x="${insetX}"
        y="${insetY}"
        width="${Math.max(1, width - insetX * 2)}"
        height="${Math.max(1, height - insetY * 2)}"
        rx="${Math.round(Math.min(width, height) * 0.12)}"
        ry="${Math.round(Math.min(width, height) * 0.12)}"
        fill="rgba(255,255,255,${blendStrength})"
      />
    </svg>
  `;

  return sharp(Buffer.from(svg))
    .blur(getFeatherSigma(style, Math.min(width, height)))
    .removeAlpha()
    .greyscale()
    .png()
    .toBuffer();
}

async function blendPatch(
  baseImage: Buffer,
  enhancedPatch: Buffer,
  region: FaceRegion,
  style: PortraitEnhanceStyle
): Promise<Buffer> {
  const resizedPatch = await sharp(enhancedPatch)
    .resize(region.width, region.height, { fit: 'fill' })
    .ensureAlpha()
    .toBuffer();
  const mask = await createFeatherMask(region.width, region.height, style);
  const maskedPatch = await sharp(resizedPatch)
    .joinChannel(mask)
    .png()
    .toBuffer();

  return sharp(baseImage)
    .composite([{ input: maskedPatch, left: region.left, top: region.top }])
    .toBuffer();
}

async function applyStyleFinish(
  patchBuffer: Buffer,
  style: PortraitEnhanceStyle
): Promise<Buffer> {
  if (normalizeStyle(style) !== 'glamour') {
    return sharp(patchBuffer)
      .modulate({ brightness: 1.01, saturation: 1.01 })
      .sharpen({ sigma: 0.45, m1: 0.2, m2: 1.2 })
      .toBuffer();
  }

  return sharp(patchBuffer)
    .median(1)
    .modulate({ brightness: 1.02, saturation: 1.03 })
    .sharpen({ sigma: 0.55, m1: 0.24, m2: 1.25 })
    .toBuffer();
}

function encodeLikeSource(
  buffer: Buffer,
  sourceMeta: sharp.Metadata
): Promise<{ buffer: Buffer; mimeType: string }> {
  const pipeline = sharp(buffer);
  if (sourceMeta.format === 'png') {
    return pipeline.png({ compressionLevel: 8, adaptiveFiltering: true }).toBuffer().then((encoded) => ({
      buffer: encoded,
      mimeType: 'image/png',
    }));
  }
  if (sourceMeta.format === 'webp') {
    return pipeline.webp({ quality: 96, effort: 5 }).toBuffer().then((encoded) => ({
      buffer: encoded,
      mimeType: 'image/webp',
    }));
  }
  return pipeline.jpeg({ quality: 96, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer().then((encoded) => ({
    buffer: encoded,
    mimeType: 'image/jpeg',
  }));
}

export async function enhancePortraitFaces(params: {
  inputBuffer: Buffer;
  userId: string;
  routing: PortraitEnhanceRouting;
  provider: 'replicate' | 'mock';
}): Promise<{ buffer: Buffer; mimeType: string; faceCount: number }> {
  const faceApi = await import('@/lib/image/face-api-loader');
  await faceApi.ensureFaceApiReady('detect');

  const orientedInput = await sharp(params.inputBuffer).rotate().toBuffer();
  const sourceMeta = await sharp(orientedInput).metadata();
  const imageWidth = sourceMeta.width ?? 0;
  const imageHeight = sourceMeta.height ?? 0;

  if (imageWidth < 1 || imageHeight < 1) {
    throw new Error('Invalid image dimensions for portrait enhancement.');
  }

  const inputTensor = await faceApi.bufferToFaceInput(orientedInput);
  const detections = await faceApi.detectFaceBoxes(inputTensor);
  const regions = selectFaceRegions(detections, imageWidth, imageHeight, inputTensor.scale);

  if (regions.length === 0) {
    throw new Error('No faces were detected in the uploaded photo. Use this tool only for clear modern portraits or selfies.');
  }

  let working = orientedInput;
  const style = normalizeStyle(params.routing.enhanceStyle);

  for (const region of regions) {
    const crop = await sharp(orientedInput).extract(region).png().toBuffer();
    const enhanced = await enhanceCrop(crop, params.userId, params.routing, params.provider);
    const finishedPatch = await applyStyleFinish(enhanced, style);
    working = await blendPatch(working, finishedPatch, region, style);
  }

  const encoded = await encodeLikeSource(working, sourceMeta);
  return { ...encoded, faceCount: regions.length };
}
