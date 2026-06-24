import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/auth/logout-button';

export async function Navbar({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'nav' });
  const user = await getCurrentUser();
  const otherLocale: Locale = locale === 'en' ? 'ro' : 'en';

  return (
    <header className="border-b border-border-default bg-background-primary sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href={user ? `/${locale}/dashboard` : `/${locale}`} className="font-semibold text-lg text-text-primary">
          PixelForge
        </Link>

        <nav className="flex items-center gap-4 md:gap-6">
          <Link href={`/${locale}/tools`} className="text-sm text-text-secondary hover:text-text-primary">
            {t('tools')}
          </Link>
          <Link href={`/${locale}/blog`} className="text-sm text-text-secondary hover:text-text-primary">
            {t('blog')}
          </Link>
          <Link href={`/${locale}/pricing`} className="text-sm text-text-secondary hover:text-text-primary">
            {t('pricing')}
          </Link>
          <Link href={`/${locale}/about`} className="text-sm text-text-secondary hover:text-text-primary">
            {t('about')}
          </Link>

          {user ? (
            <>
              <Link
                href={`/${locale}/dashboard`}
                className="text-sm bg-accent text-white px-4 py-2 rounded-md hover:bg-accent-hover transition-colors"
              >
                {t('dashboard')}
              </Link>
              <LogoutButton locale={locale} />
            </>
          ) : (
            <>
              <Link href={`/${locale}/auth/login`} className="text-sm text-text-secondary hover:text-text-primary">
                {t('login')}
              </Link>
              <Link
                href={`/${locale}/auth/signup`}
                className="text-sm bg-accent text-white px-4 py-2 rounded-md hover:bg-accent-hover transition-colors"
              >
                {t('signup')}
              </Link>
            </>
          )}

          <Link
            href={`/${otherLocale}`}
            className="text-sm text-text-tertiary hover:text-text-primary uppercase"
          >
            {otherLocale}
          </Link>
        </nav>
      </div>
    </header>
  );
}
