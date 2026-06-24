import { redirect } from 'next/navigation';
import type { Locale } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';
import { SignupForm } from '@/components/auth/signup-form';
import { AuthBrandHeader } from '@/components/auth/auth-brand-header';

export default async function SignupPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (user) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6">
      <AuthBrandHeader locale={locale} />
      <SignupForm locale={locale} />
    </div>
  );
}
