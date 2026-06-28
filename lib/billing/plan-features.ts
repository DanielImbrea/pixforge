import { PLAN_LIMITS, type PlanConfig } from '@/lib/billing/plans';
import type { PlanTier } from '@/types';

export type PlanFeature = 'batchProcessing' | 'commercialLicense';

export function planHasFeature(plan: PlanTier, feature: PlanFeature): boolean {
  return PLAN_LIMITS[plan][feature];
}

export const BATCH_MAX_FILES = 10;

export function getPlanConfig(plan: PlanTier): PlanConfig {
  return PLAN_LIMITS[plan];
}

export function getMaxResizeQuality(plan: PlanTier | null | undefined): number {
  if (!plan) return PLAN_LIMITS.free.maxResizeQuality;
  return PLAN_LIMITS[plan].maxResizeQuality;
}
