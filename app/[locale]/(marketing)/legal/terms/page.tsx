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
  return { title: t('termsTitle'), description: t('termsIntro') };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });

  const sections = [
    { title: t('termsSection1Title'), body: t('termsSection1Body') },
    { title: t('termsSection2Title'), body: t('termsSection2Body') },
    { title: t('termsSection3Title'), body: t('termsSection3Body') },
    { title: t('termsSection4Title'), body: t('termsSection4Body') },
  ];

  return (
    <LegalDocument
      backLabel={t('backToHome')}
      backHref={`/${locale}`}
      title={t('termsTitle')}
      intro={t('termsIntro')}
      sections={sections}
      disclaimer={t('legalDisclaimer')}
    />
  );
}
