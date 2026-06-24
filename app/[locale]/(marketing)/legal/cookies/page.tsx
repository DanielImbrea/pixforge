import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { Locale } from '@/i18n';
import { LegalDocument } from '@/components/marketing/legal-document';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return { title: t('cookiesTitle'), description: t('cookiesIntro') };
}

export default async function CookiesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });

  const sections = [
    { title: t('cookiesSection1Title'), body: t('cookiesSection1Body') },
    { title: t('cookiesSection2Title'), body: t('cookiesSection2Body') },
    { title: t('cookiesSection3Title'), body: t('cookiesSection3Body') },
  ];

  return (
    <LegalDocument
      backLabel={t('backToHome')}
      backHref={`/${locale}`}
      title={t('cookiesTitle')}
      intro={t('cookiesIntro')}
      sections={sections}
      disclaimer={t('legalDisclaimer')}
    />
  );
}
