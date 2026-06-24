import sharp from 'sharp';
import type { ImageContentProfile } from '@/lib/image/classify-content';

export type BackgroundFill = 'white' | 'black' | 'blur' | 'auto';

function needsFlatten(profile: ImageContentProfile): boolean {
  return profile.hasTransparency || profile.hasAlpha;
}

function autoBackground(stats: sharp.Stats): { r: number; g: number; b: number } {
  const avgR = stats.channels[0]?.mean ?? 255;
  const avgG = stats.channels[1]?.mean ?? 255;
  const avgB = stats.channels[2]?.mean ?? 255;
  const luminance = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
  return luminance < 128 ? { r: 24, g: 24, b: 24 } : { r: 255, g: 255, b: 255 };
}

export async function applyBackgroundFill(
  pipeline: sharp.Sharp,
  profile: ImageContentProfile,
  mode: BackgroundFill = 'white'
): Promise<sharp.Sharp> {
  if (!needsFlatten(profile)) {
    return pipeline;
  }

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
