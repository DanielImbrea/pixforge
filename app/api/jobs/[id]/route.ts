import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSignedUrl } from '@/lib/supabase/storage';
import { canDownloadHd } from '@/lib/billing/entitlements';
import { syncMockJobIfComplete, syncReplicateJobIfComplete } from '@/lib/ai/complete-ai-job';
import type { ImageJobRow, UserRow } from '@/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const admin = createAdminClient();
  let { data: job } = await admin.from('image_jobs').select('*').eq('id', id).single();
  if (!job) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  }
  let jobRow = job as ImageJobRow;

  if (jobRow.user_id !== authUser.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  if (jobRow.status === 'processing') {
    await syncReplicateJobIfComplete(jobRow);
    await syncMockJobIfComplete(jobRow);
    const { data: refreshed } = await admin.from('image_jobs').select('*').eq('id', id).single();
    if (refreshed) {
      jobRow = refreshed as ImageJobRow;
    }
  }

  if (jobRow.status === 'failed') {
    return NextResponse.json({ status: 'failed', errorMessage: jobRow.error_message });
  }

  if (jobRow.status !== 'done' || !jobRow.output_asset_id || !jobRow.preview_asset_id) {
    return NextResponse.json({ status: jobRow.status });
  }

  const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single();
  const user = profile as UserRow;

  const { data: previewAsset } = await supabase
    .from('image_assets')
    .select('*, storage_files(*)')
    .eq('id', jobRow.preview_asset_id)
    .eq('user_id', authUser.id)
    .single();

  if (!previewAsset || !previewAsset.storage_files) {
    return NextResponse.json({ status: 'failed', errorMessage: 'Preview not found.' });
  }

  const previewUrl = await createSignedUrl(
    previewAsset.storage_files.bucket,
    previewAsset.storage_files.storage_path,
    600
  );

  const delivery = (jobRow.params as Record<string, unknown> | undefined)?._delivery as
    | {
        outputFormat?: string;
        outputFormatLabel?: string;
        smartFormatSelected?: boolean;
        contentKind?: string;
        formatReasonKey?: string;
        sizeReductionPercent?: number | null;
        upscaleReasonKey?: string;
        upscaleWarningKey?: string;
        upscaleModelLabel?: string;
        upscaleEffectiveScale?: 2 | 4;
        upscaleSmartMode?: boolean;
        bgRemovalReasonKey?: string;
        bgRemovalModelLabel?: string;
        bgRemovalSubjectMode?: string;
        bgRemovalEdgeQuality?: string;
        bgRemovalSmartMode?: boolean;
      }
    | undefined;

  return NextResponse.json({
    status: 'done',
    previewUrl,
    canDownloadHd: canDownloadHd(user),
    outputWidth: previewAsset.storage_files.width_px,
    outputHeight: previewAsset.storage_files.height_px,
    outputSizeBytes: previewAsset.storage_files.size_bytes,
    outputFormat: delivery?.outputFormat,
    outputFormatLabel: delivery?.outputFormatLabel,
    smartFormatSelected: delivery?.smartFormatSelected,
    contentKind: delivery?.contentKind,
    formatReasonKey: delivery?.formatReasonKey,
    sizeReductionPercent: delivery?.sizeReductionPercent,
    upscaleReasonKey: delivery?.upscaleReasonKey,
    upscaleWarningKey: delivery?.upscaleWarningKey,
    upscaleModelLabel: delivery?.upscaleModelLabel,
    upscaleEffectiveScale: delivery?.upscaleEffectiveScale,
    upscaleSmartMode: delivery?.upscaleSmartMode,
    bgRemovalReasonKey: delivery?.bgRemovalReasonKey,
    bgRemovalModelLabel: delivery?.bgRemovalModelLabel,
    bgRemovalSubjectMode: delivery?.bgRemovalSubjectMode,
    bgRemovalEdgeQuality: delivery?.bgRemovalEdgeQuality,
    bgRemovalSmartMode: delivery?.bgRemovalSmartMode,
  });
}
