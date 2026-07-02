import sharp from 'sharp';
import type { FaceWithDescriptor } from '@/lib/image/face-api-loader';
import { blendFaceIntoImage, blendWithMask } from '@/lib/ai/portrait-enhance/blend';
import { applyRegionalEnhancement } from '@/lib/ai/portrait-enhance/local-regional';
import {
  assessFaceCropQuality,
  resolveProcessingMode,
  restoreBlendStrength,
} from '@/lib/ai/portrait-enhance/quality';
import {
  buildRegionalMasks,
  expandFaceCropFromLandmarks,
  FEATURE_ORDER,
} from '@/lib/ai/portrait-enhance/regions';
import { getRestoreAdapter, mockRestoreCrop } from '@/lib/ai/portrait-enhance/restore-codeformer';
import type {
  DetectedFace,
  PortraitEnhanceResult,
  PortraitEnhanceRunParams,
  PortraitFeatureKey,
} from '@/lib/ai/portrait-enhance/types';
import {
  effectiveFeatureIntensity,
  normalizePortraitEnhanceParams,
} from '@/lib/tools/portrait-enhance-params';

const MAX_FACES = 4;
const MIN_FACE_AREA_RATIO = 0.015;

function scaleDetectedFace(face: FaceWithDescriptor, detectionScale: number): DetectedFace {
  const inv = detectionScale > 0 ? 1 / detectionScale : 1;
  const box = face.detection.box;
  return {
    box: {
      x: box.x * inv,
      y: box.y * inv,
      width: box.width * inv,
      height: box.height * inv,
    },
    landmarks: face.landmarks.positions.map((p) => ({ x: p.x * inv, y: p.y * inv })),
  };
}

function selectFaces(
  faces: DetectedFace[],
  imageWidth: number,
  imageHeight: number
): DetectedFace[] {
  const imageArea = imageWidth * imageHeight;
  return faces
    .map((face) => ({
      face,
      areaRatio: (face.box.width * face.box.height) / Math.max(1, imageArea),
    }))
    .filter((item) => item.areaRatio >= MIN_FACE_AREA_RATIO)
    .sort((a, b) => b.face.box.width * b.face.box.height - a.face.box.width * a.face.box.height)
    .slice(0, MAX_FACES)
    .map((item) => item.face);
}

async function processFaceCrop(params: {
  orientedInput: Buffer;
  face: DetectedFace;
  imageWidth: number;
  imageHeight: number;
  userId: string;
  provider: 'replicate' | 'mock';
  restoreModel: string;
  codeformerFidelity: number;
  mode: ReturnType<typeof normalizePortraitEnhanceParams>['mode'];
  intensity: ReturnType<typeof normalizePortraitEnhanceParams>['intensity'];
}): Promise<{
  patch: Buffer;
  region: { left: number; top: number; width: number; height: number };
  faceMask: Buffer;
  resolvedMode: 'enhance' | 'restore';
  usedRestoreModel: boolean;
}> {
  const cropRegion = expandFaceCropFromLandmarks(
    params.face.landmarks,
    params.imageWidth,
    params.imageHeight
  );
  const originalCrop = await sharp(params.orientedInput)
    .extract(cropRegion)
    .png()
    .toBuffer();

  const quality = await assessFaceCropQuality(originalCrop);
  const resolvedMode = resolveProcessingMode(params.mode, quality);
  const masks = await buildRegionalMasks(
    params.face.landmarks,
    cropRegion.width,
    cropRegion.height,
    cropRegion.left,
    cropRegion.top
  );

  let working = originalCrop;
  let usedRestoreModel = false;

  if (resolvedMode === 'restore') {
    const restoreStrength = restoreBlendStrength(quality);
    let restored: Buffer;
    if (params.provider === 'mock') {
      restored = await mockRestoreCrop(originalCrop);
    } else {
      const adapter = getRestoreAdapter(params.restoreModel);
      restored = await adapter.enhance(originalCrop, params.userId, params.codeformerFidelity);
      usedRestoreModel = true;
    }
    const partial = await scaleMaskForRestore(masks.face, restoreStrength);
    working = await blendWithMask(originalCrop, restored, partial, cropRegion.width, cropRegion.height);
  }

  for (const feature of FEATURE_ORDER) {
    const strength = effectiveFeatureIntensity(params.intensity, feature as PortraitFeatureKey);
    if (strength <= 0.01) continue;

    const enhanced = await applyRegionalEnhancement(originalCrop, feature, strength);
    const mask = masks[feature as PortraitFeatureKey];
    working = await blendWithMask(working, enhanced, mask, cropRegion.width, cropRegion.height);
  }

  return {
    patch: working,
    region: cropRegion,
    faceMask: masks.face,
    resolvedMode,
    usedRestoreModel,
  };
}

async function scaleMaskForRestore(mask: Buffer, strength: number): Promise<Buffer> {
  return sharp(mask).linear(strength, 0).png().toBuffer();
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
  return pipeline
    .jpeg({ quality: 96, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toBuffer()
    .then((encoded) => ({
      buffer: encoded,
      mimeType: 'image/jpeg',
    }));
}

export async function runPortraitEnhancePipeline(
  params: PortraitEnhanceRunParams
): Promise<PortraitEnhanceResult> {
  const normalized = normalizePortraitEnhanceParams({
    mode: params.mode,
    preset: params.preset,
    intensity: params.intensity,
  });

  const faceApi = await import('@/lib/image/face-api-loader');
  await faceApi.ensureFaceApiReady('full');

  const orientedInput = await sharp(params.inputBuffer).rotate().toBuffer();
  const sourceMeta = await sharp(orientedInput).metadata();
  const imageWidth = sourceMeta.width ?? 0;
  const imageHeight = sourceMeta.height ?? 0;

  if (imageWidth < 1 || imageHeight < 1) {
    throw new Error('Invalid image dimensions for portrait enhancement.');
  }

  const inputTensor = await faceApi.bufferToFaceInput(orientedInput);
  const rawFaces = await faceApi.detectFacesWithDescriptors(inputTensor);
  const faces = selectFaces(
    rawFaces.map((f) => scaleDetectedFace(f, inputTensor.scale)),
    imageWidth,
    imageHeight
  );

  if (faces.length === 0) {
    throw new Error(
      'No faces were detected in the uploaded photo. Use this tool only for clear modern portraits or selfies.'
    );
  }

  let working = orientedInput;
  let resolvedMode: 'enhance' | 'restore' = 'enhance';
  let usedRestoreModel = false;

  for (const face of faces) {
    const result = await processFaceCrop({
      orientedInput,
      face,
      imageWidth,
      imageHeight,
      userId: params.userId,
      provider: params.provider,
      restoreModel: params.restoreModel,
      codeformerFidelity: params.codeformerFidelity,
      mode: normalized.mode,
      intensity: normalized.intensity,
    });

    resolvedMode = result.resolvedMode;
    usedRestoreModel = usedRestoreModel || result.usedRestoreModel;

    working = await blendFaceIntoImage(
      working,
      result.patch,
      result.region,
      result.faceMask,
      normalized.intensity.overall
    );
  }

  const encoded = await encodeLikeSource(working, sourceMeta);
  return {
    ...encoded,
    faceCount: faces.length,
    resolvedMode,
    usedRestoreModel,
  };
}
