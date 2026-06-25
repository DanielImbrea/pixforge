import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { Card } from '@/components/ui/card';
import { getAdminDashboardStats } from '@/lib/admin/queries';
import { formatAdminBytes, formatAdminDate } from '@/lib/admin/format';
import { logAdminAction } from '@/lib/admin/audit-log';
import { requireAdminUser } from '@/lib/admin/auth';

export default async function AdminDashboardPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const admin = await requireAdminUser(locale);
  const t = await getTranslations({ locale, namespace: 'admin' });
  const stats = await getAdminDashboardStats();

  await logAdminAction(admin.id, 'view_dashboard');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">{t('dashboardTitle')}</h1>
        <p className="text-sm text-text-secondary mt-1">{t('dashboardSubtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-text-tertiary">{t('statUsers')}</p>
          <p className="text-3xl font-semibold text-text-primary mt-2">{stats.totalUsers}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-tertiary">{t('statGenerations')}</p>
          <p className="text-3xl font-semibold text-text-primary mt-2">{stats.totalGenerations}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-tertiary">{t('statStorage')}</p>
          <p className="text-3xl font-semibold text-text-primary mt-2">{formatAdminBytes(stats.storageBytes)}</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-medium text-text-primary mb-4">{t('recentActivity')}</h2>
        {stats.recentLogs.length === 0 ? (
          <p className="text-sm text-text-tertiary">{t('noLogs')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-tertiary border-b border-border-default">
                  <th className="pb-2 pr-4">{t('colTime')}</th>
                  <th className="pb-2 pr-4">{t('colAdmin')}</th>
                  <th className="pb-2 pr-4">{t('colAction')}</th>
                  <th className="pb-2">{t('colTarget')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border-default/60">
                    <td className="py-2 pr-4 text-text-secondary whitespace-nowrap">
                      {formatAdminDate(log.created_at, locale)}
                    </td>
                    <td className="py-2 pr-4 text-text-primary">{log.admin_email ?? '—'}</td>
                    <td className="py-2 pr-4 text-text-primary">{log.action}</td>
                    <td className="py-2 text-text-secondary truncate max-w-xs">
                      {log.target_type ? `${log.target_type}:${log.target_id ?? '—'}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
