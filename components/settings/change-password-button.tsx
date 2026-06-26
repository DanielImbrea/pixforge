'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export function ChangePasswordButton({ email, locale }: { email: string; locale: string }) {
  const t = useTranslations('settings');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');

  const handleClick = async () => {
    setLoading(true);
    setStatus('idle');

    const supabase = createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/${locale}/auth/callback?next=reset-password`,
    });

    setLoading(false);
    setStatus(error ? 'error' : 'sent');
  };

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button variant="secondary" size="sm" disabled={loading} onClick={() => void handleClick()}>
        {t('changePassword')}
      </Button>
      {status === 'sent' ? (
        <p className="text-xs text-success">{t('changePasswordSent')}</p>
      ) : null}
      {status === 'error' ? (
        <p className="text-xs text-danger">{t('changePasswordError')}</p>
      ) : null}
    </div>
  );
}
