import { AI_CREDIT_COST, SHARP_CREDIT_COST } from '@/lib/billing/credits';
import { PLAN_LIMITS, type PlanConfig } from '@/lib/billing/plans';
import type { PlanTier } from '@/types';

/** Stripe EU card fee approximation */
const STRIPE_PERCENT = 0.029;
const STRIPE_FIXED_EUR = 0.25;

export const ESTIMATED_COST_EUR = {
  sharp: 0.001,
  ai: 0.02,
  storagePerJobMb: 0.0001,
} as const;

export interface PlanEconomics {
  plan: PlanTier;
  label: string;
  priceEur: number;
  stripeFeeEur: number;
  netRevenueEur: number;
  creditsPerPeriod: number;
  periodType: 'daily' | 'monthly';
  maxCreditsPerMonth: number;
  /** Worst case: all credits spent on AI tools */
  estimatedMaxCostEur: number;
  /** Realistic mix: 70% sharp credits / 30% AI credits */
  estimatedRealisticCostEur: number;
  estimatedMarginEur: number;
  marginPercent: number;
  revenuePerCreditEur: number;
  profitableAtMaxUsage: boolean;
  notes: string[];
}

function getMaxCreditsPerMonth(config: PlanConfig): number {
  if (config.periodType === 'daily') {
    return config.creditsPerPeriod * 30;
  }
  return config.creditsPerPeriod;
}

/** All credits spent on AI (5 credits each) */
function worstCaseCostEur(creditsPerMonth: number): number {
  const aiJobs = creditsPerMonth / AI_CREDIT_COST;
  return aiJobs * ESTIMATED_COST_EUR.ai;
}

/** 70% of credits on Sharp (1 each), 30% on AI (5 each) */
function realisticCostEur(creditsPerMonth: number): number {
  const sharpCredits = creditsPerMonth * 0.7;
  const aiCredits = creditsPerMonth * 0.3;
  const sharpJobs = sharpCredits / SHARP_CREDIT_COST;
  const aiJobs = aiCredits / AI_CREDIT_COST;
  return sharpJobs * ESTIMATED_COST_EUR.sharp + aiJobs * ESTIMATED_COST_EUR.ai;
}

export function calculatePlanEconomics(plan: PlanTier): PlanEconomics {
  const config = PLAN_LIMITS[plan];
  const priceEur = config.price.currency === 'EUR' ? config.price.amount : config.price.amount * 0.2;
  const stripeFeeEur = priceEur > 0 ? priceEur * STRIPE_PERCENT + STRIPE_FIXED_EUR : 0;
  const netRevenueEur = Math.max(0, priceEur - stripeFeeEur);
  const maxCreditsPerMonth = getMaxCreditsPerMonth(config);
  const estimatedMaxCostEur = worstCaseCostEur(maxCreditsPerMonth);
  const estimatedRealisticCostEur = realisticCostEur(maxCreditsPerMonth);
  const estimatedMarginEur = netRevenueEur - estimatedMaxCostEur;
  const marginPercent = priceEur > 0 ? (estimatedMarginEur / priceEur) * 100 : 0;
  const revenuePerCreditEur = maxCreditsPerMonth > 0 ? netRevenueEur / maxCreditsPerMonth : 0;

  const notes: string[] = [];
  if (plan === 'free') {
    notes.push('Acquisition tier — margin comes from upgrades, not direct revenue.');
  }
  notes.push(`Sharp tools = ${SHARP_CREDIT_COST} credit, AI tools = ${AI_CREDIT_COST} credits.`);
  notes.push('Max cost assumes all credits on AI (Replicate ~€0.02/job). Mock AI = €0 today.');
  notes.push('Realistic mix: 70% sharp / 30% AI credit spend.');

  return {
    plan,
    label: plan,
    priceEur,
    stripeFeeEur,
    netRevenueEur,
    creditsPerPeriod: config.creditsPerPeriod,
    periodType: config.periodType,
    maxCreditsPerMonth,
    estimatedMaxCostEur,
    estimatedRealisticCostEur,
    estimatedMarginEur,
    marginPercent,
    revenuePerCreditEur,
    profitableAtMaxUsage: estimatedMarginEur >= 0,
    notes,
  };
}

export function calculateAllPlansEconomics(): PlanEconomics[] {
  return (Object.keys(PLAN_LIMITS) as PlanTier[]).map(calculatePlanEconomics);
}

export function estimateUserPeriodCost(creditsUsed: number, aiCreditRatio = 0.3): number {
  const aiCredits = creditsUsed * aiCreditRatio;
  const sharpCredits = creditsUsed * (1 - aiCreditRatio);
  return (
    (sharpCredits / SHARP_CREDIT_COST) * ESTIMATED_COST_EUR.sharp +
    (aiCredits / AI_CREDIT_COST) * ESTIMATED_COST_EUR.ai
  );
}
