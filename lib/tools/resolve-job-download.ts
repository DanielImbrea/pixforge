import { createClient } from '@/lib/supabase/server';
import { downloadFromStorage } from '@/lib/supabase/storage';
import { buildDownloadFallbackFilename } from '@/lib/utils/trigger-download';
import { canDownloadHd } from '@/lib/billing/entitlements';
import type { ImageJobRow, UserRow } from '@/types';

export interface ResolvedJobDownload {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

export async function resolveJobDownload(jobId: string, userId: string): Promise<ResolvedJobDownload | null> {
  const supabase = await createClient();

  const { data: job } = await supabase.from('image_jobs').select('*').eq('id', jobId).single();
  if (!job) return null;

  const jobRow = job as ImageJobRow;
  if (jobRow.user_id !== userId) return null;
  if (jobRow.status !== 'done' || !jobRow.output_asset_id || !jobRow.preview_asset_id) return null;

  const { data: profile } = await supabase.from('users').select('*').eq('id', userId).single();
  if (!profile) return null;

  const user = profile as UserRow;
  const assetId = canDownloadHd(user) ? jobRow.output_asset_id : jobRow.preview_asset_id;

  const { data: asset } = await supabase
    .from('image_assets')
    .select('*, storage_files(*)')
    .eq('id', assetId)
    .eq('user_id', userId)
    .single();

  if (!asset?.storage_files) return null;

  const storageFile = asset.storage_files as {
    bucket: 'uploads' | 'outputs' | 'previews';
    storage_path: string;
    mime_type: string;
  };

  const blob = await downloadFromStorage(storageFile.bucket, storageFile.storage_path);
  const buffer = Buffer.from(await blob.arrayBuffer());

  return {
    buffer,
    mimeType: storageFile.mime_type,
    filename: buildDownloadFallbackFilename(storageFile.mime_type, jobRow.id),
  };
}

export function sanitizeZipEntryName(name: string): string {
  const cleaned = name.replace(/[/\\]/g, '_').replace(/^\.+/, '').trim();
  return cleaned || 'image';
}

export function uniqueZipEntryName(name: string, used: Set<string>): string {
  const safeName = sanitizeZipEntryName(name);
  if (!used.has(safeName)) {
    used.add(safeName);
    return safeName;
  }

  const dotIndex = safeName.lastIndexOf('.');
  const base = dotIndex > 0 ? safeName.slice(0, dotIndex) : safeName;
  const ext = dotIndex > 0 ? safeName.slice(dotIndex) : '';

  let index = 2;
  while (used.has(`${base} (${index})${ext}`)) {
    index += 1;
  }

  const unique = `${base} (${index})${ext}`;
  used.add(unique);
  return unique;
}
