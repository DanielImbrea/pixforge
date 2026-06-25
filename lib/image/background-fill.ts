import sharp from 'sharp';
import type { ImageContentProfile } from '@/lib/image/classify-content';

export type BackgroundFill = 'white' | 'black' | 'blur' | 'auto';

const FLOOD_TOLERANCE = 34;

function hasAlphaChannel(profile: ImageContentProfile): boolean {
  return profile.hasTransparency || profile.hasAlpha;
}

function isOpaqueBackgroundRequest(mode: BackgroundFill): boolean {
  return mode === 'black' || mode === 'blur' || mode === 'auto';
}

/** When background replacement should run before encode. */
export function shouldApplyBackgroundFill(
  profile: ImageContentProfile,
  outputFormat: string,
  backgroundFill: BackgroundFill
): boolean {
  if (hasAlphaChannel(profile)) {
    if (outputFormat === 'jpeg') return true;
    return isOpaqueBackgroundRequest(backgroundFill);
  }

  if (backgroundFill === 'white') return false;
  return isOpaqueBackgroundRequest(backgroundFill);
}

function autoBackground(stats: sharp.Stats): { r: number; g: number; b: number } {
  const avgR = stats.channels[0]?.mean ?? 255;
  const avgG = stats.channels[1]?.mean ?? 255;
  const avgB = stats.channels[2]?.mean ?? 255;
  const luminance = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
  return luminance < 128 ? { r: 24, g: 24, b: 24 } : { r: 255, g: 255, b: 255 };
}

function colorDistance(
  a: readonly [number, number, number],
  b: readonly [number, number, number]
): number {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
}

function readRgb(data: Uint8Array, index: number, channels: number): [number, number, number] {
  const offset = index * channels;
  return [data[offset] ?? 0, data[offset + 1] ?? 0, data[offset + 2] ?? 0];
}

function floodFillBackgroundMask(
  data: Uint8Array,
  width: number,
  height: number,
  channels: number,
  tolerance: number
): Uint8Array | null {
  if (width < 2 || height < 2) return null;

  const corners: Array<[number, number]> = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  const cornerColors = corners.map(([x, y]) => readRgb(data, y * width + x, channels));

  const bgColor: [number, number, number] = [
    Math.round(cornerColors.reduce((sum, color) => sum + color[0], 0) / cornerColors.length),
    Math.round(cornerColors.reduce((sum, color) => sum + color[1], 0) / cornerColors.length),
    Math.round(cornerColors.reduce((sum, color) => sum + color[2], 0) / cornerColors.length),
  ];

  const cornersMatch = cornerColors.every((color) => colorDistance(color, bgColor) <= tolerance);
  if (!cornersMatch) return null;

  const mask = new Uint8Array(width * height);
  const visited = new Uint8Array(width * height);
  const queue: number[] = corners.map(([x, y]) => y * width + x);

  while (queue.length > 0) {
    const index = queue.pop();
    if (index === undefined || visited[index]) continue;
    visited[index] = 1;

    const pixel = readRgb(data, index, channels);
    if (colorDistance(pixel, bgColor) > tolerance) continue;

    mask[index] = 1;
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) queue.push(index - 1);
    if (x < width - 1) queue.push(index + 1);
    if (y > 0) queue.push(index - width);
    if (y < height - 1) queue.push(index + width);
  }

  const filledRatio = mask.reduce((sum, value) => sum + value, 0) / mask.length;
  if (filledRatio < 0.08 || filledRatio > 0.92) return null;

  return mask;
}

function resolveSolidBackground(mode: BackgroundFill, stats: sharp.Stats): { r: number; g: number; b: number } {
  switch (mode) {
    case 'black':
      return { r: 0, g: 0, b: 0 };
    case 'auto':
      return autoBackground(stats);
    case 'blur':
    case 'white':
    default:
      return { r: 255, g: 255, b: 255 };
  }
}

async function replaceUniformSolidBackground(
  pipeline: sharp.Sharp,
  mode: BackgroundFill
): Promise<sharp.Sharp> {
  const meta = await pipeline.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width === 0 || height === 0) return pipeline;

  const { data, info } = await pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const channels = info.channels ?? 4;
  const mask = floodFillBackgroundMask(data, width, height, channels, FLOOD_TOLERANCE);
  if (!mask) return pipeline;

  const stats = await sharp(data, { raw: { width, height, channels } }).stats();
  const background = resolveSolidBackground(mode, stats);
  const output = Buffer.from(data);

  if (mode === 'blur') {
    const blurredBg = await sharp(data, { raw: { width, height, channels } })
      .removeAlpha()
      .blur(14)
      .raw()
      .toBuffer();

    for (let index = 0; index < mask.length; index += 1) {
      const offset = index * channels;
      if (mask[index]) {
        output[offset] = blurredBg[offset] ?? background.r;
        output[offset + 1] = blurredBg[offset + 1] ?? background.g;
        output[offset + 2] = blurredBg[offset + 2] ?? background.b;
      } else {
        output[offset] = data[offset] ?? 0;
        output[offset + 1] = data[offset + 1] ?? 0;
        output[offset + 2] = data[offset + 2] ?? 0;
      }
      if (channels > 3) output[offset + 3] = 255;
    }
  } else {
    for (let index = 0; index < mask.length; index += 1) {
      if (!mask[index]) continue;
      const offset = index * channels;
      output[offset] = background.r;
      output[offset + 1] = background.g;
      output[offset + 2] = background.b;
      if (channels > 3) output[offset + 3] = 255;
    }
  }

  return sharp(output, { raw: { width, height, channels } });
}

async function flattenTransparentBackground(
  pipeline: sharp.Sharp,
  mode: BackgroundFill
): Promise<sharp.Sharp> {
  switch (mode) {
    case 'white':
      return pipeline.flatten({ background: { r: 255, g: 255, b: 255 } });
    case 'black':
      return pipeline.flatten({ background: { r: 0, g: 0, b: 0 } });
    case 'auto': {
      const stats = await pipeline.stats();
      return pipeline.flatten({ background: autoBackground(stats) });
    }
    case 'blur': {
      const meta = await pipeline.metadata();
      const width = meta.width ?? 1;
      const height = meta.height ?? 1;
      const original = await pipeline.toBuffer();
      const blurredBg = await sharp(original)
        .resize(Math.max(1, Math.round(width / 8)), Math.max(1, Math.round(height / 8)), {
          fit: 'fill',
        })
        .blur(14)
        .resize(width, height, { fit: 'fill' })
        .toBuffer();
      return sharp(blurredBg).composite([{ input: original, blend: 'over' }]);
    }
    default:
      return pipeline.flatten({ background: { r: 255, g: 255, b: 255 } });
  }
}

export async function applyBackgroundFill(
  pipeline: sharp.Sharp,
  profile: ImageContentProfile,
  mode: BackgroundFill = 'white'
): Promise<sharp.Sharp> {
  if (hasAlphaChannel(profile)) {
    return flattenTransparentBackground(pipeline, mode);
  }

  if (mode === 'white') {
    return pipeline;
  }

  return replaceUniformSolidBackground(pipeline, mode);
}
