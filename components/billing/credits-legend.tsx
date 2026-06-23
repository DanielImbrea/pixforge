import { getTranslations } from 'next-intl/server';
import { AI_CREDIT_COST, SHARP_CREDIT_COST } from '@/lib/billing/credits';
import type { Locale } from '@/i18n';
import { Card } from '@/components/ui/card';

export async function CreditsLegend({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'pricing' });

  return (
    <Card className="max-w-2xl mx-auto mt-10">
      <h2 className="text-lg font-medium text-text-primary mb-2">{t('creditsHeading')}</h2>
      <p className="text-sm text-text-secondary mb-4">{t('creditsIntro')}</p>
      <ul className="space-y-2 text-sm text-text-secondary">
        <li className="flex items-start gap-2">
          <span className="text-success mt-0.5">⚡</span>
          <span>{t('creditsSharp', { cost: SHARP_CREDIT_COST })}</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-accent mt-0.5">✦</span>
          <span>{t('creditsAi', { cost: AI_CREDIT_COST })}</span>
        </li>
      </ul>
    </Card>
  );
}
