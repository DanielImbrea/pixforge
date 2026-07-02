import sharp from 'sharp';

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

  await validateMaskCoverage(maskBuffer);

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
    sharp(maskBuffer)
      .rotate()
      .resize(alignedWidth, alignedHeight, { fit: 'fill' })
      .greyscale()
      .threshold(128)
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

