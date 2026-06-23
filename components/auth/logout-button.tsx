'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton({ locale }: { locale: string }) {
  const t = useTranslations('nav');
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}`);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      className="text-sm text-text-tertiary hover:text-text-primary transition-colors"
    >
      {t('logout')}
    </button>
  );
}
