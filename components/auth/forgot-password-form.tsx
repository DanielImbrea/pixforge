'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ResetPasswordCheckEmail } from '@/components/auth/reset-password-check-email';

export function ForgotPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/${locale}/auth/callback?next=reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSubmittedEmail(email);
  };

  if (submittedEmail) {
    return <ResetPasswordCheckEmail locale={locale} email={submittedEmail} />;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-text-primary mb-2">{t('forgotPasswordTitle')}</h1>
      <p className="text-sm text-text-secondary text-center mb-6 leading-relaxed">{t('forgotPasswordDescription')}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        <div>
          <label className="text-sm text-text-secondary mb-1 block">{t('email')}</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {t('forgotPasswordButton')}
        </Button>
      </form>
      <p className="text-center mt-6">
        <Link
          href={`/${locale}/auth/login`}
          className="text-sm text-accent hover:text-[color:var(--accent-hover)] transition-colors"
        >
          {t('resetPasswordReturnToSignIn')}
        </Link>
      </p>
    </div>
  );
}
