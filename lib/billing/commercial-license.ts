import { planHasFeature } from '@/lib/billing/plan-features';
import type { PlanTier, UserRow } from '@/types';

export function hasCommercialLicense(user: UserRow): boolean {
  return planHasFeature(user.plan, 'commercialLicense');
}

export function getCommercialLicenseNotice(plan: PlanTier, locale: 'en' | 'ro'): string {
  if (!planHasFeature(plan, 'commercialLicense')) {
    return locale === 'ro'
      ? 'Licență personală / cu watermark. Upgrade la Pro pentru utilizare comercială.'
      : 'Personal / watermarked use. Upgrade to Pro for commercial rights.';
  }
  return locale === 'ro'
    ? 'Licență de utilizare comercială inclusă (plan Pro).'
    : 'Commercial usage license included (Pro plan).';
}
