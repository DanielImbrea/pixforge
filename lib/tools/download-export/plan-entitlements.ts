import type { PlanTier } from '@/types';
import type {
  ExportFormat,
  ExportPlanEntitlements,
} from '@/lib/tools/download-export/types';
import { EXPORT_SCALE_MAX, EXPORT_SCALE_MIN } from '@/lib/tools/download-export/types';

const BASE: Record<PlanTier, ExportPlanEntitlements> = {
  free: {
    formats: ['png', 'jpeg'],
    canUseScaleSlider: false,
    transparentBackground: false,
    compressFile: false,
    limitFileSize: false,
  },
  basic: {
    formats: ['png', 'jpeg', 'webp'],
    canUseScaleSlider: true,
    transparentBackground: false,
    compressFile: false,
    limitFileSize: false,
  },
  starter: {
    formats: ['png', 'jpeg', 'webp'],
    canUseScaleSlider: true,
    transparentBackground: true,
    compressFile: true,
    limitFileSize: true,
  },
  pro: {
    formats: ['png', 'jpeg', 'webp'],
    canUseScaleSlider: true,
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

export function clampScaleMultiplierForPlan(plan: PlanTier, multiplier: number): number {
  const ent = getExportPlanEntitlements(plan);
  if (!ent.canUseScaleSlider) return 1;
  return Math.min(EXPORT_SCALE_MAX, Math.max(EXPORT_SCALE_MIN, multiplier));
}

export function isPremiumExportFeature(
  plan: PlanTier,
  feature: 'scaleSlider' | 'transparentBackground' | 'compressFile' | 'limitFileSize'
): boolean {
  const ent = getExportPlanEntitlements(plan);
  if (feature === 'scaleSlider') return !ent.canUseScaleSlider;
  return !ent[feature];
}

export function hasStarterOrProExportFeatures(plan: PlanTier): boolean {
  return plan === 'starter' || plan === 'pro';
}
