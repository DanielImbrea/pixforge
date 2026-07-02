import type { Locale } from '@/i18n';
import type { PlanTier } from '@/types';

export type PaidPlanTier = Exclude<PlanTier, 'free'>;

export interface PlanPrice {
  amount: number;
  currency: 'EUR' | 'RON';
}

export interface PlanConfig {
  tier: PlanTier;
  price: PlanPrice;
  creditsPerPeriod: number;
  periodType: 'daily' | 'monthly';
  maxUploadMB: number;
  watermark: boolean;
  hdDownloads: boolean;
  batchProcessing: boolean;
  commercialLicense: boolean;
  maxResizeQuality: number;
}

export const PLAN_ORDER: PlanTier[] = ['free', 'basic', 'starter', 'pro'];

export const PLAN_LIMITS: Record<PlanTier, PlanConfig> = {
  free: {
    tier: 'free',
    price: { amount: 0, currency: 'EUR' },
    creditsPerPeriod: 3,
    periodType: 'daily',
    maxUploadMB: 10,
    watermark: true,
    hdDownloads: false,
    batchProcessing: false,
    commercialLicense: false,
    maxResizeQuality: 70,
  },
  basic: {
    tier: 'basic',
    price: { amount: 1.9, currency: 'EUR' },
    creditsPerPeriod: 100,
    periodType: 'monthly',
    maxUploadMB: 10,
    watermark: false,
    hdDownloads: true,
    batchProcessing: false,
    commercialLicense: false,
    maxResizeQuality: 100,
  },
  starter: {
    tier: 'starter',
    price: { amount: 4.99, currency: 'EUR' },
    creditsPerPeriod: 200,
    periodType: 'monthly',
    maxUploadMB: 25,
    watermark: false,
    hdDownloads: true,
    batchProcessing: false,
    commercialLicense: false,
    maxResizeQuality: 100,
  },
  pro: {
    tier: 'pro',
    price: { amount: 9.99, currency: 'EUR' },
    creditsPerPeriod: 700,
    periodType: 'monthly',
    maxUploadMB: 50,
    watermark: false,
    hdDownloads: true,
    batchProcessing: true,
    commercialLicense: false,
    maxResizeQuality: 100,
  },
};

export const STRIPE_PRICE_IDS: Record<PaidPlanTier, string> = {
  basic: process.env.STRIPE_PRICE_ID_BASIC || '',
  starter: process.env.STRIPE_PRICE_ID_STARTER || '',
  pro: process.env.STRIPE_PRICE_ID_PRO || '',
};

export function formatPlanPrice(config: PlanConfig, locale: Locale): string {
  const { amount, currency } = config.price;

  if (amount === 0) {
    return currency === 'RON' ? '0 lei' : '€0';
  }

  if (currency === 'RON') {
    const formatted = locale === 'ro' ? amount.toString().replace('.', ',') : amount.toString();
    return `${formatted} lei`;
  }

  return `€${amount}`;
}

export function getPeriodStartForPlan(plan: PlanTier): string {
  const config = PLAN_LIMITS[plan];
  if (config.periodType === 'daily') {
    return new Date().toISOString().slice(0, 10);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}
