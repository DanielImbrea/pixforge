import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { Card } from '@/components/ui/card';
import { listAdminAuditLogs } from '@/lib/admin/queries';
import { formatAdminDate } from '@/lib/admin/format';
import { logAdminAction } from '@/lib/admin/audit-log';
import { requireAdminUser } from '@/lib/admin/auth';

export default async function AdminLogsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const admin = await requireAdminUser(locale);
  const t = await getTranslations({ locale, namespace: 'admin' });
  const logs = await listAdminAuditLogs(100);

  await logAdminAction(admin.id, 'view_logs');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">{t('logsTitle')}</h1>
        <p className="text-sm text-text-secondary mt-1">{t('logsSubtitle')}</p>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-tertiary border-b border-border-default bg-background-secondary">
              <th className="px-4 py-3">{t('colTime')}</th>
              <th className="px-4 py-3">{t('colAdmin')}</th>
              <th className="px-4 py-3">{t('colAction')}</th>
              <th className="px-4 py-3">{t('colTarget')}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border-default/60">
                <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                  {formatAdminDate(log.created_at, locale)}
                </td>
                <td className="px-4 py-3">{log.admin_email ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                <td className="px-4 py-3 text-text-secondary truncate max-w-sm">
                  {log.target_type ? `${log.target_type}:${log.target_id ?? '—'}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="p-4 text-sm text-text-tertiary">{t('noLogs')}</p>}
      </Card>
    </div>
  );
}
