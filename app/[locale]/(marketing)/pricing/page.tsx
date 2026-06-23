import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';
import { PricingTable } from '@/components/billing/pricing-table';
import { CreditsLegend } from '@/components/billing/credits-legend';

export default async function PricingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricing' });
  const user = await getCurrentUser();

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-semibold text-text-primary mb-2">{t('heading')}</h1>
        <p className="text-text-secondary">{t('subheading')}</p>
      </div>
      <PricingTable currentPlan={user?.plan} isLoggedIn={Boolean(user)} />
      <CreditsLegend locale={locale} />
    </div>
  );
}
