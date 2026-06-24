import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { BrandLogo } from '@/components/layout/brand-logo';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });

  const links = [
    { href: `/${locale}/dashboard`, label: t('overview') },
    { href: `/${locale}/images`, label: t('myImages') },
    { href: `/${locale}/history`, label: t('history') },
    { href: `/${locale}/billing`, label: t('billing') },
    { href: `/${locale}/settings`, label: t('settings') },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 flex gap-10">
      <aside className="w-48 shrink-0">
        <BrandLogo href={`/${locale}/dashboard`} size="md" className="mb-6" />
        <DashboardNav links={links} />
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
