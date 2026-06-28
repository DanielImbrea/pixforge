'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/i18n';
import type { PaidPlanTier } from '@/lib/billing/plans';
import type { PlanTier } from '@/types';

interface PlanCardCtaProps {
  tier: PlanTier;
  locale: Locale;
  isLoggedIn: boolean;
  isCurrent?: boolean;
}

export function PlanCardCta({ tier, locale, isLoggedIn, isCurrent = false }: PlanCardCtaProps) {
  const t = useTranslations('pricing');

  const handleSubscribe = async (plan: PaidPlanTier) => {
    if (!isLoggedIn) {
      window.location.href = `/${locale}/auth/signup`;
      return;
    }

    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, locale }),
    });

    if (!res.ok) return;
    const { url } = await res.json();
    window.location.href = url;
  };

  if (tier === 'free') {
    return (
      <Button variant="secondary" className="w-full mt-auto" disabled={isCurrent}>
        {isCurrent ? t('currentPlan') : t('free')}
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      className="w-full mt-auto"
      disabled={isCurrent}
      onClick={() => handleSubscribe(tier as PaidPlanTier)}
    >
      {isCurrent ? t('currentPlan') : t('subscribe')}
    </Button>
  );
}
