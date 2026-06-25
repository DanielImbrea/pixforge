import type { ReactNode } from 'react';
import type { Locale } from '@/i18n';
import { requireAdminUser } from '@/lib/admin/auth';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  await requireAdminUser(locale);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 flex gap-10">
      <AdminSidebar locale={locale} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
