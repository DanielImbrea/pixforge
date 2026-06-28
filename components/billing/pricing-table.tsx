'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { PlanCardCta } from '@/components/billing/plan-card-cta';
import { PLAN_LIMITS, PLAN_ORDER, formatPlanPrice } from '@/lib/billing/plans';
import type { Locale } from '@/i18n';
import type { PlanTier } from '@/types';

interface PricingTableProps {
  currentPlan?: PlanTier;
  isLoggedIn: boolean;
}

export function PricingTable({ currentPlan, isLoggedIn }: PricingTableProps) {
  const t = useTranslations('pricing');
  const params = useParams();
  const locale = ((params?.locale as string) || 'en') as Locale;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {PLAN_ORDER.map((tier) => {
        const config = PLAN_LIMITS[tier];
        const label = t(tier);
        const isCurrent = currentPlan === tier;
        const creditsLabel =
          config.periodType === 'daily'
            ? t('creditsPerDay', { count: config.creditsPerPeriod })
            : t('creditsPerMonth', { count: config.creditsPerPeriod });
        const priceLabel = formatPlanPrice(config, locale);
        const showPerMonth = config.price.amount > 0;

        return (
          <Card key={tier} className={`flex flex-col h-full ${isCurrent ? 'border-2 border-accent' : ''}`}>
            <h3 className="text-lg font-medium text-text-primary mb-1">{label}</h3>
            <p className="text-3xl font-semibold text-text-primary mb-4">
              {priceLabel}
              {showPerMonth && <span className="text-sm text-text-tertiary">{t('perMonth')}</span>}
            </p>
            <ul className="space-y-2 mb-6 text-sm text-text-secondary">
              <li>{creditsLabel}</li>
              <li>{t('maxUploadPerFile', { mb: config.maxUploadMB })}</li>
              <li>{config.watermark ? t('watermarkedOutput') : t('noWatermark')}</li>
              <li>{config.hdDownloads ? t('hdDownloads') : t('standardDownloads')}</li>
              {config.batchProcessing && <li>{t('batchProcessing')}</li>}
              {config.commercialLicense && <li>{t('commercialLicense')}</li>}
            </ul>
            <PlanCardCta tier={tier} locale={locale} isLoggedIn={isLoggedIn} isCurrent={isCurrent} />
          </Card>
        );
      })}
    </div>
  );
}
