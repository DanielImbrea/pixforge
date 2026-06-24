import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { Locale } from '@/i18n';
import { Card } from '@/components/ui/card';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return { title: t('title'), description: t('intro') };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link href={`/${locale}`} className="text-sm text-accent hover:underline mb-6 inline-block">
        ← {t('backToHome')}
      </Link>
      <h1 className="text-3xl font-semibold text-text-primary mb-4">{t('title')}</h1>
      <p className="text-text-secondary mb-8">{t('intro')}</p>
      <Card className="space-y-6 text-text-secondary">
        <div>
          <p className="text-sm font-medium text-text-primary mb-1">{t('emailLabel')}</p>
          <a href={`mailto:${t('email')}`} className="text-accent hover:underline">
            {t('email')}
          </a>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary mb-1">{t('responseLabel')}</p>
          <p className="text-sm">{t('responseTime')}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary mb-1">{t('companyLabel')}</p>
          <p className="text-sm">{t('companyName')}</p>
        </div>
        <p className="text-sm">
          {t('faqHint')}{' '}
          <Link href={`/${locale}#faq`} className="text-accent hover:underline">
            {t('faqLink')}
          </Link>
        </p>
      </Card>
    </div>
  );
}
