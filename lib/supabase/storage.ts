import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

export type Bucket = 'uploads' | 'outputs' | 'previews';

export interface UploadResult {
  storagePath: string;
  bucket: Bucket;
}

export async function uploadBufferToStorage(
  buffer: Buffer,
  bucket: Bucket,
  userId: string,
  mimeType: string
): Promise<UploadResult> {
  const supabase = createAdminClient();
  const extension = mimeType.split('/')[1] || 'bin';
  const storagePath = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return { storagePath, bucket };
}

export async function createSignedUrl(bucket: Bucket, storagePath: string, expiresInSeconds = 600): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) {
    throw new Error(`Failed to create signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}

export async function createSignedUrlsForBucket(
  bucket: Bucket,
  storagePaths: string[],
  expiresInSeconds = 600
): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();
  if (storagePaths.length === 0) return urlMap;

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(storagePaths, expiresInSeconds);

  if (error || !data) {
    throw new Error(`Failed to create signed URLs: ${error?.message}`);
  }

  data.forEach((item, index) => {
    if (item.signedUrl) {
      urlMap.set(storagePaths[index], item.signedUrl);
    }
  });

  return urlMap;
}

export async function deleteFromStorage(bucket: Bucket, storagePath: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.storage.from(bucket).remove([storagePath]);
}

export async function downloadFromStorage(bucket: Bucket, storagePath: string): Promise<Blob> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(bucket).download(storagePath);

  if (error || !data) {
    throw new Error(`Storage download failed: ${error?.message ?? 'unknown error'}`);
  }

  return data;
}
