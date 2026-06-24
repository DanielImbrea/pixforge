import type { OutputFormat } from '@/lib/image/sharp-encode';
import {
  dynamicAvifQuality,
  dynamicJpegPhotoQuality,
  dynamicWebpPhotoQuality,
} from '@/lib/image/sharp-encode';

export type QualityIntent = 'fast' | 'balanced' | 'max';

export interface ResolvedQuality {
  qualityOverride?: number;
  lossless?: boolean;
}

export function resolveQualityForFormat(
  format: OutputFormat,
  intent: QualityIntent,
  width: number,
  height: number,
  preferLossless: boolean
): ResolvedQuality {
  if (format === 'png' || (preferLossless && format === 'webp')) {
    return { lossless: true };
  }

  switch (intent) {
    case 'fast':
      if (format === 'webp') return { qualityOverride: 65 };
      if (format === 'avif') return { qualityOverride: 50 };
      if (format === 'jpeg') return { qualityOverride: 72 };
      break;
    case 'max':
      if (format === 'webp') return { lossless: true };
      if (format === 'avif') return { qualityOverride: 88 };
      if (format === 'jpeg') return { qualityOverride: 92 };
      break;
    case 'balanced':
    default:
      if (format === 'webp') return { qualityOverride: dynamicWebpPhotoQuality(width, height) };
      if (format === 'avif') return { qualityOverride: dynamicAvifQuality(width, height) };
      if (format === 'jpeg') return { qualityOverride: dynamicJpegPhotoQuality(width, height) };
      break;
  }

  return {};
}

export function computeSizeReductionPercent(
  inputBytes: number,
  outputBytes: number
): number | null {
  if (inputBytes <= 0 || outputBytes >= inputBytes) return null;
  return Math.round((1 - outputBytes / inputBytes) * 100);
}
