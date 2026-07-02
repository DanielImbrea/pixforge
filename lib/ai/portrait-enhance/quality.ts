import sharp from 'sharp';
import type { FaceQualityAssessment } from '@/lib/ai/portrait-enhance/types';

const RESTORE_THRESHOLD = 0.42;

/** Laplacian variance on a greyscale face crop — low = blurry / compressed. */
export async function assessFaceCropQuality(cropBuffer: Buffer): Promise<FaceQualityAssessment> {
  const meta = await sharp(cropBuffer).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  if (width < 8 || height < 8) {
    return {
      score: 0,
      needsRestore: true,
      blurVariance: 0,
      faceResolutionScore: 0,
    };
  }

  const grey = await sharp(cropBuffer).greyscale().raw().toBuffer();
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap =
        4 * grey[i] -
        grey[i - 1] -
        grey[i + 1] -
        grey[i - width] -
        grey[i + width];
      sum += lap;
      sumSq += lap * lap;
      count += 1;
    }
  }

  const mean = count > 0 ? sum / count : 0;
  const blurVariance = count > 0 ? Math.max(0, sumSq / count - mean * mean) : 0;
  const blurScore = Math.min(1, blurVariance / 420);

  const facePixels = width * height;
  const faceResolutionScore = Math.min(1, facePixels / (220 * 220));

  const score = blurScore * 0.62 + faceResolutionScore * 0.38;

  return {
    score,
    needsRestore: score < RESTORE_THRESHOLD,
    blurVariance,
    faceResolutionScore,
  };
}

export function resolveProcessingMode(
  userMode: 'auto' | 'enhance' | 'restore',
  quality: FaceQualityAssessment
): 'enhance' | 'restore' {
  if (userMode === 'restore') return 'restore';
  if (userMode === 'enhance') return 'enhance';
  return quality.needsRestore ? 'restore' : 'enhance';
}

/** How strongly to blend CodeFormer restore (0–1) — never full replacement. */
export function restoreBlendStrength(quality: FaceQualityAssessment): number {
  const deficit = Math.max(0, RESTORE_THRESHOLD - quality.score);
  return Math.min(0.72, 0.28 + deficit * 1.1);
}
