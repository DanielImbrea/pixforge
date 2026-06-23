import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSignedUrlsForBucket, type Bucket } from '@/lib/supabase/storage';

export default async function MyImagesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  const user = await getCurrentUser();

  if (!user) return null;

  const admin = createAdminClient();
  const { data: assets } = await admin
    .from('image_assets')
    .select('id, storage_files(bucket, storage_path)')
    .eq('user_id', user.id)
    .eq('asset_type', 'preview')
    .order('created_at', { ascending: false })
    .limit(24);

  const storagePaths: { id: string; bucket: Bucket; path: string }[] = [];

  for (const asset of assets || []) {
    const raw = asset.storage_files as
      | { bucket: Bucket; storage_path: string }
      | { bucket: Bucket; storage_path: string }[]
      | null;
    const storageFile = Array.isArray(raw) ? raw[0] : raw;
    if (storageFile?.storage_path) {
      storagePaths.push({
        id: asset.id,
        bucket: storageFile.bucket,
        path: storageFile.storage_path,
      });
    }
  }

  const bucketEntries = (['uploads', 'outputs', 'previews'] as Bucket[])
    .map((bucket) => ({
      bucket,
      paths: storagePaths.filter((item) => item.bucket === bucket).map((item) => item.path),
    }))
    .filter((entry) => entry.paths.length > 0);

  const signedUrlResults = await Promise.all(
    bucketEntries.map(({ bucket, paths }) =>
      createSignedUrlsForBucket(bucket, paths).then((urls) => ({ bucket, urls }))
    )
  );

  const urlsByBucket = new Map(signedUrlResults.map(({ bucket, urls }) => [bucket, urls]));

  const imagesWithUrls = storagePaths
    .map((item) => ({
      id: item.id,
      url: urlsByBucket.get(item.bucket)?.get(item.path) ?? null,
    }))
    .filter((item) => item.url);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-text-primary mb-6">{t('myImages')}</h1>
      {imagesWithUrls.length === 0 ? (
        <p className="text-sm text-text-tertiary">{t('noImagesYet')}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {imagesWithUrls.map((img) => (
            <div key={img.id} className="rounded-lg border border-border-default overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url!}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-32 object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
