import sharp from 'sharp';
import {
  blurGreyMask,
  dilateBinary,
  type MaskMorphGrid,
} from '@/lib/tools/object-remove-mask-morph';
import {
  OBJECT_REMOVE_INPAINT_MASK_DILATE_PX,
  OBJECT_REMOVE_INPAINT_MASK_FEATHER_PX,
} from '@/lib/tools/object-remove-inpaint-config';

const FLUX_ALIGN = 32;
const FLUX_MAX_SIDE = 1440;

export class ObjectRemoveMaskError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ObjectRemoveMaskError';
  }
}

async function validateMaskCoverage(maskBuffer: Buffer): Promise<void> {
  const { data, info } = await sharp(maskBuffer)
    .rotate()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let white = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i] > 128) white += 1;
  }

  const ratio = white / data.length;
  if (ratio < 0.0005) {
    throw new ObjectRemoveMaskError('Selection is empty. Mark the object to remove first.');
  }
  if (ratio > 0.85) {
    throw new ObjectRemoveMaskError('Selection covers too much of the image. Refine the mask.');
  }
}

/** Expand + soften mask for Flux Fill (removes edges, shadows, seams). */
async function prepareInpaintMask(maskBuffer: Buffer, width: number, height: number): Promise<Buffer> {
  const { data } = await sharp(maskBuffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const binary = new Uint8Array(width * height);
  for (let i = 0; i < binary.length; i++) {
    binary[i] = data[i] > 128 ? 1 : 0;
  }

  let grid: MaskMorphGrid = { data: binary, width, height };
  grid = dilateBinary(grid, OBJECT_REMOVE_INPAINT_MASK_DILATE_PX);

  let grey = new Uint8Array(grid.data.length);
  for (let i = 0; i < grid.data.length; i++) {
    grey[i] = grid.data[i] ? 255 : 0;
  }
  const feathered = blurGreyMask(grey, width, height, OBJECT_REMOVE_INPAINT_MASK_FEATHER_PX);

  return sharp(Buffer.from(feathered), { raw: { width, height, channels: 1 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Align image + mask for flux-fill-dev (same size, binary mask, multiples of 32). */
export async function normalizeObjectRemoveInpaintInputs(
  imageBuffer: Buffer,
  maskBuffer: Buffer
): Promise<{
  imageBuffer: Buffer;
  maskBuffer: Buffer;
  originalWidth: number;
  originalHeight: number;
}> {
  const image = sharp(imageBuffer).rotate();
  const meta = await image.metadata();
  const originalWidth = meta.width ?? 1;
  const originalHeight = meta.height ?? 1;

  const maskMeta = await sharp(maskBuffer).rotate().metadata();
  const maskWidth = maskMeta.width ?? 0;
  const maskHeight = maskMeta.height ?? 0;

  const maskAlignedToImage = await sharp(maskBuffer)
    .rotate()
    .resize(originalWidth, originalHeight, { fit: 'fill' })
    .greyscale()
    .threshold(128)
    .png({ compressionLevel: 9 })
    .toBuffer();

  const maskForInpaint = await prepareInpaintMask(maskAlignedToImage, originalWidth, originalHeight);

  if (maskWidth !== originalWidth || maskHeight !== originalHeight) {
    console.warn('[object-remove] mask dimensions adjusted to match image', {
      image: `${originalWidth}x${originalHeight}`,
      mask: `${maskWidth}x${maskHeight}`,
    });
  }

  await validateMaskCoverage(maskAlignedToImage);

  let width = originalWidth;
  let height = originalHeight;

  const longest = Math.max(width, height);
  if (longest > FLUX_MAX_SIDE) {
    const scale = FLUX_MAX_SIDE / longest;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const alignedWidth = Math.max(FLUX_ALIGN, Math.round(width / FLUX_ALIGN) * FLUX_ALIGN);
  const alignedHeight = Math.max(FLUX_ALIGN, Math.round(height / FLUX_ALIGN) * FLUX_ALIGN);

  const [normalizedImage, normalizedMask] = await Promise.all([
    image
      .resize(alignedWidth, alignedHeight, { fit: 'fill' })
      .jpeg({ quality: 95, mozjpeg: true })
      .toBuffer(),
    sharp(maskForInpaint)
      .resize(alignedWidth, alignedHeight, { fit: 'fill' })
      .png({ compressionLevel: 9 })
      .toBuffer(),
  ]);

  return {
    imageBuffer: normalizedImage,
    maskBuffer: normalizedMask,
    originalWidth,
    originalHeight,
  };
}

/** Ensure preview output is an opaque full-frame JPEG at the original dimensions. */
export async function finalizeObjectRemovePreview(
  outputBuffer: Buffer,
  originalWidth: number,
  originalHeight: number
): Promise<Buffer> {
  return sharp(outputBuffer)
    .rotate()
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .resize(originalWidth, originalHeight, { fit: 'fill' })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

