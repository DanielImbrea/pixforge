import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { Card } from '@/components/ui/card';

export default async function CommercialLicensePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link href={`/${locale}/pricing`} className="text-sm text-accent hover:underline mb-6 inline-block">
        ← {t('backToPricing')}
      </Link>
      <h1 className="text-3xl font-semibold text-text-primary mb-4">{t('commercialTitle')}</h1>
      <Card className="prose prose-sm max-w-none text-text-secondary space-y-4">
        <p>{t('commercialIntro')}</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>{t('commercialBullet1')}</li>
          <li>{t('commercialBullet2')}</li>
          <li>{t('commercialBullet3')}</li>
        </ul>
        <p className="text-xs text-text-tertiary">{t('commercialDisclaimer')}</p>
      </Card>
    </div>
  );
}
