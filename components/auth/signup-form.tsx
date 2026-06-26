'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MailCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function SignupForm({ locale }: { locale: string }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${appUrl}/${locale}/auth/callback`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.user?.identities?.length === 0) {
      setError(t('signupEmailAlreadyRegistered'));
      return;
    }

    if (data.session) {
      router.push(`/${locale}/tools`);
      router.refresh();
      return;
    }

    setRegisteredEmail(email);
  };

  if (registeredEmail) {
    return (
      <div className="flex flex-col items-center w-full max-w-sm">
        <Card className="w-full border-[color:var(--success)]/25 bg-[color:var(--success)]/5">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--success)]/15">
              <MailCheck className="h-6 w-6 text-success" aria-hidden />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-text-primary">{t('signupSuccessTitle')}</h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                {t('signupSuccessDescription', { email: registeredEmail })}
              </p>
              <p className="text-xs text-text-tertiary">{t('signupSuccessHint')}</p>
            </div>
            <Link
              href={`/${locale}/auth/login`}
              className="text-sm font-medium text-accent hover:text-[color:var(--accent-hover)] transition-colors"
            >
              {t('signupSuccessLoginLink')}
            </Link>
          </div>
        </Card>
        <p className="text-sm text-text-tertiary mt-6">
          {t('haveAccount')}{' '}
          <Link href={`/${locale}/auth/login`} className="text-accent">
            {t('loginButton')}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-text-primary mb-6">{t('signupTitle')}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        <div>
          <label className="text-sm text-text-secondary mb-1 block">{t('email')}</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm text-text-secondary mb-1 block">{t('password')}</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={loading}>
          {t('signupButton')}
        </Button>
      </form>
      <p className="text-sm text-text-tertiary mt-4">
        {t('haveAccount')}{' '}
        <Link href={`/${locale}/auth/login`} className="text-accent">
          {t('loginButton')}
        </Link>
      </p>
    </div>
  );
}
