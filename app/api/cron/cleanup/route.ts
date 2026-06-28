import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteFromStorage } from '@/lib/supabase/storage';
import type { Bucket } from '@/lib/supabase/storage';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Called by Vercel Cron (daily on Hobby; hourly requires Pro) or an external
 * scheduler with Authorization: Bearer CRON_SECRET. Deletes storage_files rows whose
 * expires_at has passed, along with the underlying Storage object. All buckets
 * (uploads, outputs, previews) share the same retention window — see
 * lib/storage/retention.ts.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: expiredFiles, error } = await admin
    .from('storage_files')
    .select('id, bucket, storage_path')
    .lt('expires_at', nowIso)
    .limit(2000);

  if (error) {
    return NextResponse.json({ error: 'Failed to query expired files.' }, { status: 500 });
  }

  let deletedCount = 0;
  const errors: string[] = [];

  for (const file of expiredFiles || []) {
    try {
      await deleteFromStorage(file.bucket as Bucket, file.storage_path);
      await admin.from('storage_files').delete().eq('id', file.id);
      deletedCount += 1;
    } catch (err) {
      errors.push(`${file.id}: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  }

  return NextResponse.json({
    deletedCount,
    remainingCandidates: (expiredFiles || []).length - deletedCount,
    errors,
  });
}
