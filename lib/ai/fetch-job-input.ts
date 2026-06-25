import { createAdminClient } from '@/lib/supabase/admin';
import { fetchAsBuffer } from '@/lib/ai/fetch-image';
import { createSignedUrl } from '@/lib/supabase/storage';
import type { ImageJobRow } from '@/types';

export async function fetchJobInputBuffer(jobRow: ImageJobRow): Promise<Buffer> {
  const admin = createAdminClient();
  const { data: inputAsset } = await admin
    .from('image_assets')
    .select('*, storage_files(*)')
    .eq('id', jobRow.input_asset_id)
    .single();

  if (!inputAsset?.storage_files) {
    throw new Error('Input asset missing.');
  }

  const inputUrl = await createSignedUrl(
    inputAsset.storage_files.bucket,
    inputAsset.storage_files.storage_path,
    600
  );
  return fetchAsBuffer(inputUrl);
}
