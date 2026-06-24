'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import type { Locale } from '@/i18n';
import { LogoutButton } from '@/components/auth/logout-button';
import { cn } from '@/lib/utils/cn';

interface NavbarMenuProps {
  locale: Locale;
  isLoggedIn: boolean;
  otherLocale: Locale;
}

const linkClass =
  'text-sm text-text-secondary hover:text-text-primary transition-colors';
const mobileLinkClass =
  'block rounded-md px-3 py-2.5 text-base text-text-primary hover:bg-background-secondary transition-colors';

export function NavbarMenu({ locale, isLoggedIn, otherLocale }: NavbarMenuProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const navLinks = [
    { href: `/${locale}/tools`, label: t('tools') },
    { href: `/${locale}/blog`, label: t('blog') },
    { href: `/${locale}/pricing`, label: t('pricing') },
    { href: `/${locale}/about`, label: t('about') },
  ];

  return (
    <>
      <nav className="hidden md:flex items-center gap-4 lg:gap-6">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className={linkClass}>
            {link.label}
          </Link>
        ))}

        {isLoggedIn ? (
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
            <Link href={`/${locale}/auth/login`} className={linkClass}>
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

        <Link href={`/${otherLocale}`} className={`${linkClass} uppercase`}>
          {otherLocale}
        </Link>
      </nav>

      <button
        type="button"
        className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-border-default text-text-primary hover:bg-background-secondary transition-colors"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? t('closeMenu') : t('openMenu')}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-label={t('closeMenu')}
            onClick={() => setOpen(false)}
          />
          <div
            id="mobile-nav"
            className="fixed inset-y-0 right-0 z-50 flex w-[min(100vw,20rem)] flex-col border-l border-border-default bg-background-primary shadow-xl md:hidden"
          >
            <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
              <span className="text-sm font-medium text-text-primary">{t('menu')}</span>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-background-secondary hover:text-text-primary"
                aria-label={t('closeMenu')}
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    mobileLinkClass,
                    pathname === link.href || pathname.startsWith(`${link.href}/`)
                      ? 'bg-accent/10 text-accent font-medium'
                      : ''
                  )}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className="my-3 border-t border-border-default" />

              {isLoggedIn ? (
                <>
                  <Link
                    href={`/${locale}/dashboard`}
                    className={cn(mobileLinkClass, 'bg-accent text-white hover:bg-accent-hover hover:text-white font-medium')}
                    onClick={() => setOpen(false)}
                  >
                    {t('dashboard')}
                  </Link>
                  <div className="px-3 py-2">
                    <LogoutButton locale={locale} />
                  </div>
                </>
              ) : (
                <>
                  <Link href={`/${locale}/auth/login`} className={mobileLinkClass} onClick={() => setOpen(false)}>
                    {t('login')}
                  </Link>
                  <Link
                    href={`/${locale}/auth/signup`}
                    className={cn(mobileLinkClass, 'bg-accent text-white hover:bg-accent-hover hover:text-white font-medium')}
                    onClick={() => setOpen(false)}
                  >
                    {t('signup')}
                  </Link>
                </>
              )}

              <Link
                href={`/${otherLocale}`}
                className={cn(mobileLinkClass, 'uppercase')}
                onClick={() => setOpen(false)}
              >
                {otherLocale}
              </Link>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
