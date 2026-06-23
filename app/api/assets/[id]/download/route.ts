import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSignedUrl } from '@/lib/supabase/storage';
import { canDownloadHd } from '@/lib/billing/entitlements';
import { hasCommercialLicense } from '@/lib/billing/commercial-license';
import type { ImageJobRow, UserRow } from '@/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { data: job } = await supabase.from('image_jobs').select('*').eq('id', id).single();
  if (!job) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  }
  const jobRow = job as ImageJobRow;

  if (jobRow.user_id !== authUser.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  if (jobRow.status !== 'done' || !jobRow.output_asset_id || !jobRow.preview_asset_id) {
    return NextResponse.json({ error: 'Job is not ready for download.' }, { status: 400 });
  }

  const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single();
  const user = profile as UserRow;
  const userCanDownloadHd = canDownloadHd(user);
  const commercialLicense = hasCommercialLicense(user);

  const assetId = userCanDownloadHd ? jobRow.output_asset_id : jobRow.preview_asset_id;

  const { data: asset } = await supabase
    .from('image_assets')
    .select('*, storage_files(*)')
    .eq('id', assetId)
    .eq('user_id', authUser.id)
    .single();

  if (!asset || !asset.storage_files) {
    return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
  }

  if (asset.user_id !== authUser.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const url = await createSignedUrl(asset.storage_files.bucket, asset.storage_files.storage_path, 300);

  return NextResponse.json({
    url,
    license: commercialLicense
      ? {
          type: 'commercial',
          plan: user.plan,
          jobId: jobRow.id,
          grantedAt: jobRow.completed_at || new Date().toISOString(),
          termsUrl: '/legal/commercial-license',
        }
      : {
          type: 'personal',
          plan: user.plan,
          watermark: !userCanDownloadHd,
        },
  });
}
