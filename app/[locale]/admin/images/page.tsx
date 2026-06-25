import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { listAdminImages } from '@/lib/admin/queries';
import { formatAdminBytes, formatAdminDate } from '@/lib/admin/format';
import { logAdminAction } from '@/lib/admin/audit-log';
import { requireAdminUser } from '@/lib/admin/auth';
import { AdminDeleteImageButton } from '@/components/admin/admin-delete-image-button';

export default async function AdminImagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ user?: string }>;
}) {
  const { locale } = await params;
  const { user: userEmail } = await searchParams;
  const admin = await requireAdminUser(locale);
  const t = await getTranslations({ locale, namespace: 'admin' });
  const images = await listAdminImages({ userEmail, limit: 48 });

  await logAdminAction(admin.id, 'view_images', { metadata: { filter: userEmail ?? null } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">{t('imagesTitle')}</h1>
        <p className="text-sm text-text-secondary mt-1">{t('imagesSubtitle')}</p>
      </div>

      <form className="flex gap-2 max-w-md" method="get">
        <Input name="user" defaultValue={userEmail ?? ''} placeholder={t('filterByEmail')} />
        <Button type="submit" variant="secondary">
          {t('filter')}
        </Button>
      </form>

      {images.length === 0 ? (
        <Card>
          <p className="text-sm text-text-tertiary">{t('noImages')}</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <Card key={img.assetId} className="p-0 overflow-hidden">
              <div className="aspect-video bg-background-secondary flex items-center justify-center">
                {img.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img.previewUrl} alt="" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs text-text-tertiary">{t('previewUnavailable')}</span>
                )}
              </div>
              <div className="p-4 space-y-2">
                <p className="text-sm font-medium text-text-primary truncate">{img.userEmail}</p>
                <p className="text-xs text-text-tertiary">
                  {img.assetType} · {formatAdminBytes(img.sizeBytes)} · {formatAdminDate(img.createdAt, locale)}
                </p>
                <p className="text-xs text-text-tertiary truncate" title={img.storagePath}>
                  {img.bucket}/{img.storagePath}
                </p>
                <AdminDeleteImageButton storageFileId={img.storageFileId} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
