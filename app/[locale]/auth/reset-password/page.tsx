import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default async function ResetPasswordPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6">
      <h1 className="text-2xl font-semibold text-text-primary mb-2">{t('resetPasswordTitle')}</h1>
      <p className="text-sm text-text-secondary text-center mb-6 max-w-sm leading-relaxed">{t('resetPasswordDescription')}</p>
      <Suspense fallback={<div className="h-40 w-full max-w-sm animate-pulse rounded-md bg-background-secondary" />}>
        <ResetPasswordForm locale={locale} />
      </Suspense>
    </div>
  );
}
