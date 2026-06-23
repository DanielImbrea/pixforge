'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const redirectTo = searchParams.get('redirectTo') || `/${locale}/dashboard`;
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <div>
        <label className="text-sm text-text-secondary mb-1 block">{t('email')}</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="text-sm text-text-secondary mb-1 block">{t('password')}</label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={loading}>
        {t('loginButton')}
      </Button>
    </form>
  );
}
