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
  return { title: t('privacyTitle'), description: t('privacyIntro') };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });

  const sections = [
    { title: t('privacySection1Title'), body: t('privacySection1Body') },
    { title: t('privacySection2Title'), body: t('privacySection2Body') },
    { title: t('privacySection3Title'), body: t('privacySection3Body') },
    { title: t('privacySection4Title'), body: t('privacySection4Body') },
    { title: t('privacySection5Title'), body: t('privacySection5Body') },
    { title: t('privacySection6Title'), body: t('privacySection6Body') },
    { title: t('privacySection7Title'), body: t('privacySection7Body') },
  ];

  return (
    <LegalDocument
      backLabel={t('backToHome')}
      backHref={`/${locale}`}
      title={t('privacyTitle')}
      intro={t('privacyIntro')}
      sections={sections}
      disclaimer={t('legalDisclaimer')}
    />
  );
}
