import sharp from 'sharp';

export type ImageContentKind = 'photo' | 'screenshot' | 'graphic' | 'logo';

export interface ImageContentProfile {
  kind: ImageContentKind;
  hasTransparency: boolean;
  hasAlpha: boolean;
  inputFormat: string | undefined;
  edgeScore: number;
  flatColorRatio: number;
}

const DISPLAY_DIMENSIONS = new Set([
  720, 768, 800, 900, 1080, 1200, 1280, 1366, 1440, 1536, 1600, 1920, 2560, 2880, 3840,
]);

async function computeEdgeScore(buffer: Buffer): Promise<number> {
  const { data } = await sharp(buffer)
    .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
    .greyscale()
    .convolve({
      width: 3,
      height: 3,
      kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (data.length === 0) return 0;

  let sum = 0;
  for (let i = 0; i < data.length; i += 1) {
    sum += data[i] ?? 0;
  }
  return sum / data.length;
}

/** Share of pixels that fall into coarse color buckets — high values suggest logos/flat UI. */
async function computeFlatColorRatio(buffer: Buffer): Promise<number> {
  const { data, info } = await sharp(buffer)
    .resize(96, 96, { fit: 'inside', withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixelCount = info.width * info.height;
  if (pixelCount === 0 || data.length < pixelCount * 3) return 0;

  const buckets = new Set<string>();
  for (let i = 0; i < data.length; i += 3) {
    const r = (data[i] ?? 0) >> 4;
    const g = (data[i + 1] ?? 0) >> 4;
    const b = (data[i + 2] ?? 0) >> 4;
    buckets.add(`${r},${g},${b}`);
  }

  const uniqueColors = buckets.size;
  return Math.max(0, Math.min(1, 1 - uniqueColors / pixelCount));
}

/**
 * Lightweight heuristic classifier — no ML, runs in milliseconds on a downsampled pass.
 * Classify first, encode second (industry pattern).
 */
export async function classifyImageContent(buffer: Buffer): Promise<ImageContentProfile> {
  const meta = await sharp(buffer).metadata();
  const stats = await sharp(buffer).stats();

  const hasAlpha = Boolean(meta.hasAlpha);
  const alphaChannel = stats.channels[3];
  const hasTransparency = hasAlpha && alphaChannel !== undefined && alphaChannel.min < 250;
  const hasExif = Boolean(meta.exif && meta.exif.length > 0);
  const format = meta.format;
  const width = meta.width || 0;
  const height = meta.height || 0;
  const edgeScore = await computeEdgeScore(buffer);
  const flatColorRatio = await computeFlatColorRatio(buffer);
  const colorVariance =
    stats.channels.slice(0, 3).reduce((sum, channel) => sum + channel.stdev, 0) /
    Math.max(1, Math.min(3, stats.channels.length));

  const matchesDisplaySize = DISPLAY_DIMENSIONS.has(width) || DISPLAY_DIMENSIONS.has(height);

  const base = {
    hasTransparency,
    hasAlpha,
    inputFormat: format,
    edgeScore,
    flatColorRatio,
  };

  if (hasTransparency && flatColorRatio > 0.45 && edgeScore < 14) {
    return { kind: 'logo', ...base };
  }

  if (hasTransparency) {
    return { kind: 'screenshot', ...base };
  }

  if (flatColorRatio > 0.55 && edgeScore < 12 && !hasExif) {
    return { kind: 'logo', ...base };
  }

  if (hasExif && format !== 'png') {
    return { kind: 'photo', ...base };
  }

  if (format === 'png') {
    if (flatColorRatio > 0.5 && edgeScore < 12) {
      return { kind: 'logo', ...base };
    }
    if (edgeScore >= 14 || matchesDisplaySize) {
      return { kind: 'screenshot', ...base };
    }
    return { kind: 'graphic', ...base };
  }

  if ((format === 'jpeg' || format === 'webp' || format === 'avif') && edgeScore < 12 && colorVariance > 22) {
    return { kind: 'photo', ...base };
  }

  if (edgeScore >= 16 || matchesDisplaySize) {
    return { kind: 'screenshot', ...base };
  }

  if (colorVariance > 30 && edgeScore < 14) {
    return { kind: 'photo', ...base };
  }

  return { kind: 'graphic', ...base };
}
