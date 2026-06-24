import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';
import { PricingTable } from '@/components/billing/pricing-table';
import { CreditsLegend } from '@/components/billing/credits-legend';
import { generatePricingMetadata } from '@/lib/seo/generate-metadata';
import { generatePricingJsonLd } from '@/lib/seo/jsonld';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generatePricingMetadata(locale);
}

export default async function PricingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricing' });
  const user = await getCurrentUser();
  const jsonLd = generatePricingJsonLd(locale);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-text-primary mb-2">{t('heading')}</h1>
          <p className="text-text-secondary mb-2">{t('subheading')}</p>
          <p className="text-sm text-accent font-medium">{t('freePlanHint')}</p>
        </div>
        <PricingTable currentPlan={user?.plan} isLoggedIn={Boolean(user)} />
        <CreditsLegend locale={locale} />
      </div>
    </>
  );
}
