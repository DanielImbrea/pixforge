import sharp from 'sharp';

export type ImageContentKind = 'photo' | 'screenshot' | 'graphic';

export interface ImageContentProfile {
  kind: ImageContentKind;
  hasTransparency: boolean;
  hasAlpha: boolean;
  inputFormat: string | undefined;
  edgeScore: number;
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

/**
 * Lightweight heuristic classifier — no ML, runs in milliseconds on a downsampled pass.
 * Separates photos (natural imagery) from screenshots/UI (sharp edges, flat regions).
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
  const colorVariance =
    stats.channels.slice(0, 3).reduce((sum, channel) => sum + channel.stdev, 0) /
    Math.max(1, Math.min(3, stats.channels.length));

  const matchesDisplaySize = DISPLAY_DIMENSIONS.has(width) || DISPLAY_DIMENSIONS.has(height);

  const base = {
    hasTransparency,
    hasAlpha,
    inputFormat: format,
    edgeScore,
  };

  if (hasTransparency) {
    return { kind: 'screenshot', ...base };
  }

  if (hasExif && format !== 'png') {
    return { kind: 'photo', ...base };
  }

  if (format === 'png') {
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
