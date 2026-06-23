'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { PLAN_LIMITS } from '@/lib/billing/plans';
import type { PlanTier } from '@/types';

interface UsageMeterProps {
  plan: PlanTier;
  creditsUsed: number;
}

export function UsageMeter({ plan, creditsUsed }: UsageMeterProps) {
  const t = useTranslations('dashboard');
  const config = PLAN_LIMITS[plan];
  const isOverLimit = creditsUsed > config.creditsPerPeriod;
  const percentage = Math.min(100, Math.round((creditsUsed / config.creditsPerPeriod) * 100));
  const periodLabel = config.periodType === 'daily' ? t('usageThisDay') : t('usageThisMonth');

  return (
    <Card>
      <p className="text-sm text-text-secondary mb-2">{periodLabel}</p>
      <p className="text-2xl font-semibold text-text-primary mb-3">
        {creditsUsed}{' '}
        <span className="text-text-tertiary text-base">/ {config.creditsPerPeriod} {t('credits')}</span>
      </p>
      <div className="h-2 w-full rounded-full bg-background-tertiary overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${isOverLimit ? 'bg-red-500' : 'bg-accent'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-text-tertiary mt-3">{t('maxUploadPerFile', { mb: config.maxUploadMB })}</p>
    </Card>
  );
}
