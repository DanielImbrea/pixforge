import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { listAdminUsers } from '@/lib/admin/queries';
import { formatAdminDate } from '@/lib/admin/format';
import { logAdminAction } from '@/lib/admin/audit-log';
import { requireAdminUser } from '@/lib/admin/auth';

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  const admin = await requireAdminUser(locale);
  const t = await getTranslations({ locale, namespace: 'admin' });
  const users = await listAdminUsers(q);

  await logAdminAction(admin.id, 'view_users', { metadata: { search: q ?? null } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">{t('usersTitle')}</h1>
        <p className="text-sm text-text-secondary mt-1">{t('usersSubtitle')}</p>
      </div>

      <form className="flex gap-2 max-w-md" method="get">
        <Input name="q" defaultValue={q ?? ''} placeholder={t('searchEmail')} />
        <Button type="submit" variant="secondary">
          {t('search')}
        </Button>
      </form>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-tertiary border-b border-border-default bg-background-secondary">
              <th className="px-4 py-3">{t('colEmail')}</th>
              <th className="px-4 py-3">{t('colPlan')}</th>
              <th className="px-4 py-3">{t('colCredits')}</th>
              <th className="px-4 py-3">{t('colCreated')}</th>
              <th className="px-4 py-3">{t('colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border-default/60 hover:bg-background-secondary/50">
                <td className="px-4 py-3">
                  <Link href={`/${locale}/admin/users/${user.id}`} className="text-accent hover:underline">
                    {user.email}
                  </Link>
                </td>
                <td className="px-4 py-3 capitalize">{user.plan}</td>
                <td className="px-4 py-3">
                  {user.creditsUsed} / {user.creditsLimit}
                </td>
                <td className="px-4 py-3 text-text-secondary">{formatAdminDate(user.created_at, locale)}</td>
                <td className="px-4 py-3">
                  {user.deleted_at ? (
                    <span className="text-danger text-xs font-medium">{t('statusDeleted')}</span>
                  ) : user.role === 'admin' ? (
                    <span className="text-accent text-xs font-medium">{t('statusAdmin')}</span>
                  ) : (
                    <span className="text-text-tertiary text-xs">{t('statusActive')}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="p-4 text-sm text-text-tertiary">{t('noUsers')}</p>}
      </Card>
    </div>
  );
}
