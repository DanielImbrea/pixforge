import sharp from 'sharp';

/** Blend enhanced patch into base using a greyscale mask (0–255). */
export async function blendWithMask(
  baseImage: Buffer,
  enhancedImage: Buffer,
  mask: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  const resizedMask = await sharp(mask).resize(width, height, { fit: 'fill' }).greyscale().toBuffer();
  const resizedEnhanced = await sharp(enhancedImage).resize(width, height, { fit: 'fill' }).toBuffer();

  const maskedEnhanced = await sharp(resizedEnhanced)
    .ensureAlpha()
    .composite([{ input: resizedMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const inverted = await sharp(resizedMask).negate().toBuffer();
  const maskedBase = await sharp(baseImage)
    .resize(width, height, { fit: 'fill' })
    .ensureAlpha()
    .composite([{ input: inverted, blend: 'dest-in' }])
    .png()
    .toBuffer();

  return sharp({
    create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } },
  })
    .composite([
      { input: maskedBase },
      { input: maskedEnhanced },
    ])
    .removeAlpha()
    .toBuffer();
}

export async function scaleMaskIntensity(mask: Buffer, alpha: number): Promise<Buffer> {
  if (alpha >= 0.999) return mask;
  if (alpha <= 0) {
    return sharp(mask).linear(0, 0).png().toBuffer();
  }
  return sharp(mask).linear(alpha, 0).png().toBuffer();
}

export async function blendFaceIntoImage(
  baseImage: Buffer,
  facePatch: Buffer,
  region: { left: number; top: number; width: number; height: number },
  faceMask: Buffer,
  overallIntensity: number
): Promise<Buffer> {
  const alpha = Math.max(0, Math.min(1, overallIntensity / 100));
  if (alpha <= 0.001) return baseImage;

  const scaledMask = await scaleMaskIntensity(faceMask, alpha);
  const maskedPatch = await sharp(facePatch)
    .resize(region.width, region.height, { fit: 'fill' })
    .ensureAlpha()
    .composite([{ input: scaledMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  return sharp(baseImage)
    .composite([{ input: maskedPatch, left: region.left, top: region.top }])
    .toBuffer();
}
