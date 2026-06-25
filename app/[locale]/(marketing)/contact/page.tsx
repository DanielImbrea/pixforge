import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { Locale } from '@/i18n';
import { Card } from '@/components/ui/card';
import { ContactForm } from '@/components/contact/contact-form';

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
      <h1 className="text-3xl font-semibold text-text-primary mb-3">{t('title')}</h1>
      <p className="text-text-secondary mb-8 max-w-xl">{t('intro')}</p>

      <Card>
        <h2 className="text-lg font-medium text-text-primary mb-6">{t('formTitle')}</h2>
        <ContactForm locale={locale} />
      </Card>

      <p className="mt-8 text-sm text-text-tertiary">
        {t('responseTime')}
      </p>
      <p className="mt-3 text-sm text-text-secondary">
        {t('faqHint')}{' '}
        <Link href={`/${locale}#faq`} className="text-accent hover:underline">
          {t('faqLink')}
        </Link>
      </p>
    </div>
  );
}
