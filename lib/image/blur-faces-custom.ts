import sharp from 'sharp';
import type { BlurFacesRouting } from '@/lib/ai/blur-faces-routing';
import { blurStrengthToSigma } from '@/lib/tools/blur-faces-params';
import { FaceBlurError } from '@/lib/image/face-blur-error';
import { pickFacesToBlur } from '@/lib/image/face-blur-match';

export { FaceBlurError };
export type { FaceBlurErrorKey } from '@/lib/image/face-blur-error';

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

async function blurRegion(
  imageBuffer: Buffer,
  region: { left: number; top: number; width: number; height: number },
  sigma: number
): Promise<Buffer> {
  const blurredPatch = await sharp(imageBuffer).extract(region).blur(sigma).toBuffer();
  return sharp(imageBuffer).composite([{ input: blurredPatch, left: region.left, top: region.top }]).toBuffer();
}

async function encodePreservingFormat(
  processed: Buffer,
  sourceMeta: sharp.Metadata
): Promise<{ buffer: Buffer; mimeType: string }> {
  const pipeline = sharp(processed);
  const format = sourceMeta.format;

  if (format === 'png') {
    return { buffer: await pipeline.png().toBuffer(), mimeType: 'image/png' };
  }
  if (format === 'webp') {
    return { buffer: await pipeline.webp({ quality: 90 }).toBuffer(), mimeType: 'image/webp' };
  }
  if (format === 'avif') {
    return { buffer: await pipeline.avif({ quality: 60 }).toBuffer(), mimeType: 'image/avif' };
  }

  return {
    buffer: await pipeline.jpeg({ quality: 92, mozjpeg: true }).toBuffer(),
    mimeType: 'image/jpeg',
  };
}

export async function applyCustomFaceBlur(
  inputBuffer: Buffer,
  referenceBuffer: Buffer,
  routing: BlurFacesRouting
): Promise<{ buffer: Buffer; mimeType: string; blurredFaceCount: number }> {
  const faceApi = await import('@/lib/image/face-api-loader');

  await faceApi.ensureFaceApiReady('full');

  const orientedInput = await sharp(inputBuffer).rotate().toBuffer();
  const orientedReference = await sharp(referenceBuffer).rotate().toBuffer();
  const sourceMeta = await sharp(orientedInput).metadata();
  const imageWidth = sourceMeta.width ?? 0;
  const imageHeight = sourceMeta.height ?? 0;

  if (imageWidth < 1 || imageHeight < 1) {
    throw new FaceBlurError(
      'invalid dimensions',
      'Face detection failed.',
      'blurFacesErrorDetectionFailed'
    );
  }

  const referenceInput = await faceApi.bufferToFaceInput(orientedReference);
  const referenceDescriptor = await faceApi.getPrimaryFaceDescriptor(referenceInput);
  if (!referenceDescriptor) {
    throw new FaceBlurError(
      'reference face missing',
      'No face found in the reference portrait. Upload a clear, front-facing photo of the face.',
      'blurFacesErrorNoFaceInPortrait'
    );
  }

  const inputTensor = await faceApi.bufferToFaceInput(orientedInput);
  const faces = await faceApi.detectFacesWithDescriptors(inputTensor);
  if (faces.length === 0) {
    throw new FaceBlurError(
      'no faces in image',
      'No faces were detected in the uploaded photo.',
      'blurFacesErrorNoFacesInImage'
    );
  }

  const threshold = faceApi.getFaceMatchThreshold();
  const facesToBlur = pickFacesToBlur(
    faces,
    referenceDescriptor,
    routing.customAction,
    (a, b) => faceApi.faceDistance(a, b),
    threshold
  );

  if (facesToBlur.length === 0) {
    if (routing.customAction === 'exclude' && faces.length === 1) {
      const encoded = await encodePreservingFormat(orientedInput, sourceMeta);
      return { ...encoded, blurredFaceCount: 0 };
    }
    throw new FaceBlurError(
      'no faces matched selection',
      routing.customAction === 'exclude'
        ? 'Could not find the reference person in the photo. Try a clearer portrait or crop closer to the face.'
        : 'No matching face was found in the photo. Try a clearer reference portrait or crop closer to the face.',
      'blurFacesErrorNoMatch'
    );
  }

  const sigma = blurStrengthToSigma(routing.blurStrength);
  let working = orientedInput;

  for (const face of facesToBlur) {
    const region = expandBox(face.detection.box, imageWidth, imageHeight, inputTensor.scale);
    working = await blurRegion(working, region, sigma);
  }

  const encoded = await encodePreservingFormat(working, sourceMeta);
  return { ...encoded, blurredFaceCount: facesToBlur.length };
}

export async function applyAutomaticFaceBlur(
  inputBuffer: Buffer,
  routing: BlurFacesRouting
): Promise<{ buffer: Buffer; mimeType: string; blurredFaceCount: number }> {
  const faceApi = await import('@/lib/image/face-api-loader');

  await faceApi.ensureFaceApiReady('detect');

  const orientedInput = await sharp(inputBuffer).rotate().toBuffer();
  const sourceMeta = await sharp(orientedInput).metadata();
  const imageWidth = sourceMeta.width ?? 0;
  const imageHeight = sourceMeta.height ?? 0;

  if (imageWidth < 1 || imageHeight < 1) {
    throw new FaceBlurError(
      'invalid dimensions',
      'Face detection failed.',
      'blurFacesErrorDetectionFailed'
    );
  }

  const inputTensor = await faceApi.bufferToFaceInput(orientedInput);
  const detections = await faceApi.detectFaceBoxes(inputTensor);
  if (detections.length === 0) {
    throw new FaceBlurError(
      'no faces in image',
      'No faces were detected in the uploaded photo.',
      'blurFacesErrorNoFacesInImage'
    );
  }

  const sigma = blurStrengthToSigma(routing.blurStrength);
  let working = orientedInput;

  for (const detection of detections) {
    const region = expandBox(detection.box, imageWidth, imageHeight, inputTensor.scale);
    working = await blurRegion(working, region, sigma);
  }

  const encoded = await encodePreservingFormat(working, sourceMeta);
  return { ...encoded, blurredFaceCount: detections.length };
}
