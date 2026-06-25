import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { Card } from '@/components/ui/card';
import { getAdminUserDetail } from '@/lib/admin/queries';
import { formatAdminDate } from '@/lib/admin/format';
import { logAdminAction } from '@/lib/admin/audit-log';
import { requireAdminUser } from '@/lib/admin/auth';
import { AdminDeleteUserButton } from '@/components/admin/admin-delete-user-button';
import { createSignedUrl, type Bucket } from '@/lib/supabase/storage';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  const admin = await requireAdminUser(locale);
  const t = await getTranslations({ locale, namespace: 'admin' });
  const detail = await getAdminUserDetail(id);

  if (!detail) notFound();

  await logAdminAction(admin.id, 'view_user', { targetType: 'user', targetId: id });

  const assetPreviews: { id: string; url: string; type: string }[] = [];
  for (const asset of detail.assets) {
    const sf = asset.storage_files as
      | { bucket: string; storage_path: string }
      | { bucket: string; storage_path: string }[]
      | null;
    const storageFile = Array.isArray(sf) ? sf[0] : sf;
    if (!storageFile) continue;
    try {
      const url = await createSignedUrl(storageFile.bucket as Bucket, storageFile.storage_path, 300);
      assetPreviews.push({ id: asset.id, url, type: asset.asset_type });
    } catch {
      // skip broken assets
    }
  }

  return (
    <div className="space-y-6">
      <Link href={`/${locale}/admin/users`} className="text-sm text-accent hover:underline">
        ← {t('backToUsers')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{detail.user.email}</h1>
          <p className="text-sm text-text-secondary mt-1">
            {t('userMeta', {
              plan: detail.user.plan,
              credits: `${detail.creditsUsed}/${detail.creditsLimit}`,
            })}
          </p>
        </div>
        {!detail.user.deleted_at && detail.user.id !== admin.id && (
          <AdminDeleteUserButton userId={detail.user.id} locale={locale} />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-text-tertiary">{t('colCreated')}</p>
          <p className="text-text-primary mt-1">{formatAdminDate(detail.user.created_at, locale)}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-tertiary">{t('colStatus')}</p>
          <p className="text-text-primary mt-1">
            {detail.user.deleted_at ? t('statusDeleted') : detail.user.role === 'admin' ? t('statusAdmin') : t('statusActive')}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-medium text-text-primary mb-4">{t('usageHistory')}</h2>
        {detail.jobs.length === 0 ? (
          <p className="text-sm text-text-tertiary">{t('noJobs')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-tertiary border-b border-border-default">
                  <th className="pb-2 pr-4">{t('colTime')}</th>
                  <th className="pb-2 pr-4">{t('colTool')}</th>
                  <th className="pb-2 pr-4">{t('colStatus')}</th>
                  <th className="pb-2">{t('colCredits')}</th>
                </tr>
              </thead>
              <tbody>
                {detail.jobs.map((job) => (
                  <tr key={job.id} className="border-b border-border-default/60">
                    <td className="py-2 pr-4 text-text-secondary">{formatAdminDate(job.created_at, locale)}</td>
                    <td className="py-2 pr-4">{job.tool_id}</td>
                    <td className="py-2 pr-4 capitalize">{job.status}</td>
                    <td className="py-2">{job.units_cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-medium text-text-primary mb-4">{t('userImages')}</h2>
        {assetPreviews.length === 0 ? (
          <p className="text-sm text-text-tertiary">{t('noImages')}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {assetPreviews.map((img) => (
              <div key={img.id} className="rounded-lg border border-border-default overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="w-full h-28 object-cover bg-background-secondary" />
                <p className="text-xs text-text-tertiary px-2 py-1 capitalize">{img.type}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
