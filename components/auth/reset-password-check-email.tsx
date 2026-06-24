'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { getEmailProvider } from '@/lib/auth/email-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ResetPasswordCheckEmailProps {
  locale: string;
  email: string;
}

export function ResetPasswordCheckEmail({ locale, email }: ResetPasswordCheckEmailProps) {
  const t = useTranslations('auth');
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [reconfirmStatus, setReconfirmStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');

  const provider = getEmailProvider(email);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');

  const sendResetEmail = async () => {
    setResendStatus('loading');
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/${locale}/auth/callback?next=reset-password`,
    });
    setResendStatus(error ? 'error' : 'sent');
  };

  const resendConfirmation = async () => {
    setReconfirmStatus('loading');
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${appUrl}/${locale}/auth/callback`,
      },
    });
    setReconfirmStatus(error ? 'error' : 'sent');
  };

  return (
    <div className="w-full max-w-md">
      <Card className="shadow-sm">
        <h1 className="text-xl font-semibold text-text-primary mb-4">{t('resetPasswordCheckEmailTitle')}</h1>

        <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
          <p>
            {t.rich('resetPasswordCheckEmailLead', {
              highlight: (chunks) => <span className="font-medium text-text-primary">{chunks}</span>,
              email,
            })}
          </p>
          <p>{t('resetPasswordCheckEmailBackup')}</p>
          <p>
            {t.rich('resetPasswordCheckEmailSpam', {
              resend: (chunks) => (
                <button
                  type="button"
                  onClick={sendResetEmail}
                  disabled={resendStatus === 'loading'}
                  className="text-accent hover:text-[color:var(--accent-hover)] underline underline-offset-2 disabled:opacity-50"
                >
                  {chunks}
                </button>
              ),
              reconfirm: (chunks) => (
                <button
                  type="button"
                  onClick={resendConfirmation}
                  disabled={reconfirmStatus === 'loading'}
                  className="text-accent hover:text-[color:var(--accent-hover)] underline underline-offset-2 disabled:opacity-50"
                >
                  {chunks}
                </button>
              ),
            })}
          </p>
          {(resendStatus === 'sent' || reconfirmStatus === 'sent') && (
            <p className="text-success text-xs">{t('resetPasswordActionSent')}</p>
          )}
          {(resendStatus === 'error' || reconfirmStatus === 'error') && (
            <p className="text-danger text-xs">{t('resetPasswordActionError')}</p>
          )}
        </div>

        {provider && (
          <Button
            variant="primary"
            size="lg"
            className="w-full mt-6"
            type="button"
            onClick={() => window.open(provider.url, '_blank', 'noopener,noreferrer')}
          >
            {t('resetPasswordOpenMail', { provider: provider.name })}
          </Button>
        )}
      </Card>

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
