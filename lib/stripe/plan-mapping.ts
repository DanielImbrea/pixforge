import { STRIPE_PRICE_IDS, type PaidPlanTier } from '@/lib/billing/plans';
import type { PlanTier } from '@/types';

export function planFromPriceId(priceId: string): PlanTier | null {
  if (priceId === STRIPE_PRICE_IDS.basic) return 'basic';
  if (priceId === STRIPE_PRICE_IDS.starter) return 'starter';
  if (priceId === STRIPE_PRICE_IDS.pro) return 'pro';
  return null;
}

export function priceIdFromPlan(plan: PaidPlanTier): string {
  return STRIPE_PRICE_IDS[plan];
}
