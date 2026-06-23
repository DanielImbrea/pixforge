import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';
import { LoginForm } from '@/components/auth/login-form';

export default async function LoginPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (user) {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations({ locale, namespace: 'auth' });

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6">
      <h1 className="text-2xl font-semibold text-text-primary mb-6">{t('loginTitle')}</h1>
      <Suspense fallback={<div className="h-48 w-full max-w-sm animate-pulse rounded-md bg-background-secondary" />}>
        <LoginForm locale={locale} />
      </Suspense>
      <p className="text-sm text-text-tertiary mt-4">
        {t('noAccount')}{' '}
        <Link href={`/${locale}/auth/signup`} className="text-accent">
          {t('signupButton')}
        </Link>
      </p>
    </div>
  );
}
