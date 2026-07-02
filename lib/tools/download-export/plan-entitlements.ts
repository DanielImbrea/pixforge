import type { PlanTier } from '@/types';
import type { ExportFormat, ExportPlanEntitlements, ExportScalePercent } from '@/lib/tools/download-export/types';

const BASE: Record<PlanTier, ExportPlanEntitlements> = {
  free: {
    formats: ['png', 'jpeg'],
    maxScalePercent: 75,
    transparentBackground: false,
    compressFile: false,
    limitFileSize: false,
  },
  basic: {
    formats: ['png', 'jpeg', 'webp'],
    maxScalePercent: 100,
    transparentBackground: false,
    compressFile: false,
    limitFileSize: false,
  },
  starter: {
    formats: ['png', 'jpeg', 'webp'],
    maxScalePercent: 100,
    transparentBackground: false,
    compressFile: false,
    limitFileSize: false,
  },
  pro: {
    formats: ['png', 'jpeg', 'webp'],
    maxScalePercent: 100,
    transparentBackground: true,
    compressFile: true,
    limitFileSize: true,
  },
};

export function getExportPlanEntitlements(plan: PlanTier): ExportPlanEntitlements {
  return BASE[plan];
}

export function isFormatAllowed(plan: PlanTier, format: ExportFormat): boolean {
  return getExportPlanEntitlements(plan).formats.includes(format);
}

export function clampScaleForPlan(plan: PlanTier, scale: ExportScalePercent): ExportScalePercent {
  const max = getExportPlanEntitlements(plan).maxScalePercent;
  if (scale <= 25) return 25;
  if (scale <= 50) return max >= 50 ? 50 : max;
  if (scale <= 75) return max >= 75 ? 75 : max;
  return max;
}

export function isProOnlyFeature(
  plan: PlanTier,
  feature: 'transparentBackground' | 'compressFile' | 'limitFileSize'
): boolean {
  const ent = getExportPlanEntitlements(plan);
  return !ent[feature];
}
