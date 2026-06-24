import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { Locale } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (user) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6">
      <Suspense fallback={<div className="h-64 w-full max-w-md animate-pulse rounded-lg bg-background-secondary" />}>
        <ForgotPasswordForm locale={locale} />
      </Suspense>
    </div>
  );
}
