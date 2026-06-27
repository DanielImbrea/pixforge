import sharp from 'sharp';
import type { BlurFacesRouting } from '@/lib/ai/blur-faces-routing';
import { blurStrengthToSigma, type BlurCustomAction } from '@/lib/tools/blur-faces-params';

export class FaceBlurError extends Error {
  constructor(
    message: string,
    readonly userMessage: string
  ) {
    super(message);
    this.name = 'FaceBlurError';
  }
}

function shouldBlurFace(isMatch: boolean, customAction: BlurCustomAction): boolean {
  return customAction === 'blur' ? isMatch : !isMatch;
}

function expandBox(
  box: { x: number; y: number; width: number; height: number },
  imageWidth: number,
  imageHeight: number
): { left: number; top: number; width: number; height: number } {
  const padX = Math.round(box.width * 0.18);
  const padY = Math.round(box.height * 0.22);
  const left = Math.max(0, Math.round(box.x - padX));
  const top = Math.max(0, Math.round(box.y - padY));
  const width = Math.min(imageWidth - left, Math.round(box.width + padX * 2));
  const height = Math.min(imageHeight - top, Math.round(box.height + padY * 2));
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

  await faceApi.ensureFaceApiReady();

  const orientedInput = await sharp(inputBuffer).rotate().toBuffer();
  const orientedReference = await sharp(referenceBuffer).rotate().toBuffer();
  const sourceMeta = await sharp(orientedInput).metadata();
  const imageWidth = sourceMeta.width ?? 0;
  const imageHeight = sourceMeta.height ?? 0;

  if (imageWidth < 1 || imageHeight < 1) {
    throw new FaceBlurError('invalid dimensions', 'Face detection failed.');
  }

  const referenceCanvas = await faceApi.bufferToCanvas(orientedReference);
  const referenceDescriptor = await faceApi.getPrimaryFaceDescriptor(referenceCanvas);
  if (!referenceDescriptor) {
    throw new FaceBlurError('reference face missing', 'Face detection failed.');
  }

  const inputCanvas = await faceApi.bufferToCanvas(orientedInput);
  const faces = await faceApi.detectFacesWithDescriptors(inputCanvas);
  if (faces.length === 0) {
    throw new FaceBlurError('no faces in image', 'No faces were detected.');
  }

  const threshold = faceApi.getFaceMatchThreshold();
  const facesToBlur = faces.filter((face) => {
    const distance = faceApi.faceDistance(referenceDescriptor, face.descriptor);
    const isMatch = distance < threshold;
    return shouldBlurFace(isMatch, routing.customAction);
  });

  if (facesToBlur.length === 0) {
    throw new FaceBlurError('no faces matched selection', 'No matching face was found in the image.');
  }

  const sigma = blurStrengthToSigma(routing.blurStrength);
  let working = orientedInput;

  for (const face of facesToBlur) {
    const region = expandBox(face.detection.box, imageWidth, imageHeight);
    working = await blurRegion(working, region, sigma);
  }

  const encoded = await encodePreservingFormat(working, sourceMeta);
  return { ...encoded, blurredFaceCount: facesToBlur.length };
}
