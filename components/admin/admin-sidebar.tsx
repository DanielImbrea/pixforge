'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';

interface AdminSidebarProps {
  locale: string;
}

export function AdminSidebar({ locale }: AdminSidebarProps) {
  const t = useTranslations('admin');
  const pathname = usePathname();

  const links = [
    { href: `/${locale}/admin`, label: t('navDashboard'), exact: true },
    { href: `/${locale}/admin/users`, label: t('navUsers') },
    { href: `/${locale}/admin/images`, label: t('navImages') },
    { href: `/${locale}/admin/logs`, label: t('navLogs') },
  ];

  return (
    <aside className="w-52 shrink-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary mb-4">{t('panelTitle')}</p>
      <nav className="flex flex-col gap-1">
        {links.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-text-secondary hover:bg-background-secondary hover:text-text-primary'
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <Link href={`/${locale}/dashboard`} className="mt-8 inline-block text-xs text-text-tertiary hover:text-accent">
        ← {t('backToApp')}
      </Link>
    </aside>
  );
}
