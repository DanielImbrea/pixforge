import { planHasFeature } from '@/lib/billing/plan-features';
import type { PlanTier, UserRow } from '@/types';

export function hasCommercialLicense(user: UserRow): boolean {
  return planHasFeature(user.plan, 'commercialLicense');
}

export function getCommercialLicenseNotice(plan: PlanTier, locale: 'en' | 'ro'): string {
  void plan;
  return locale === 'ro'
    ? 'Poți folosi rezultatele procesate cum dorești — personal sau comercial.'
    : 'You may use processed outputs however you need — personal or commercial.';
}
