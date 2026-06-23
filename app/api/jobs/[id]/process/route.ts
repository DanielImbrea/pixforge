import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getToolById } from '@/lib/tools/registry';
import { getProcessor } from '@/lib/tools/get-processor';
import { finalizeJobOutput } from '@/lib/tools/finalize-job-output';
import { createSignedUrl } from '@/lib/supabase/storage';
import { chargeJobOnCompletion, canDownloadHd, refundFailedJob } from '@/lib/billing/entitlements';
import type { ImageJobRow, UserRow } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

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

  const tool = getToolById(jobRow.tool_id);
  if (!tool) {
    return NextResponse.json({ error: 'Tool not found.' }, { status: 404 });
  }

  const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single();
  if (!profile) {
    return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
  }
  const user = profile as UserRow;

  const { data: inputAsset } = await supabase
    .from('image_assets')
    .select('*, storage_files(*)')
    .eq('id', jobRow.input_asset_id)
    .single();

  if (!inputAsset || !inputAsset.storage_files) {
    return NextResponse.json({ error: 'Input asset not found.' }, { status: 404 });
  }

  const inputAssetUrl = await createSignedUrl(
    inputAsset.storage_files.bucket,
    inputAsset.storage_files.storage_path,
    300
  );

  await admin.from('image_jobs').update({ status: 'processing' }).eq('id', jobRow.id);

  const processor = getProcessor(tool);
  const result = await processor.process({ job: jobRow, tool, inputAssetUrl });

  if (result.status === 'failed') {
    await admin
      .from('image_jobs')
      .update({ status: 'failed', error_message: result.error || 'Processing failed.' })
      .eq('id', jobRow.id);
    await refundFailedJob(user, jobRow);
    return NextResponse.json({ error: result.error || 'Processing failed.' }, { status: 500 });
  }

  if (result.status === 'processing') {
    await admin
      .from('image_jobs')
      .update({ provider_job_id: result.providerJobId || null })
      .eq('id', jobRow.id);
    return NextResponse.json({ status: 'processing' });
  }

  if (!result.outputBuffer || !result.outputMimeType) {
    await admin
      .from('image_jobs')
      .update({ status: 'failed', error_message: 'Processor returned no output.' })
      .eq('id', jobRow.id);
    await refundFailedJob(user, jobRow);
    return NextResponse.json({ error: 'Processor returned no output.' }, { status: 500 });
  }

  const finalized = await finalizeJobOutput({
    userId: user.id,
    jobId: jobRow.id,
    outputBuffer: result.outputBuffer,
    outputMimeType: result.outputMimeType,
    isFreePlan: user.plan === 'free',
    toolType: tool.type,
    toolCategory: tool.category,
  });

  await chargeJobOnCompletion(user, jobRow);

  return NextResponse.json({
    status: 'done',
    previewUrl: finalized.previewUrl,
    canDownloadHd: canDownloadHd(user),
  });
}
