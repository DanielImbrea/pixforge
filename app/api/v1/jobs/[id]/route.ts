import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api/authenticate-api-key';
import { createAdminClient } from '@/lib/supabase/admin';
import { getProcessor } from '@/lib/tools/get-processor';
import { getToolById } from '@/lib/tools/registry';
import { finalizeJobOutput } from '@/lib/tools/finalize-job-output';
import { chargeJobOnCompletion, refundFailedJob } from '@/lib/billing/entitlements';
import { planHasFeature } from '@/lib/billing/plan-features';
import { syncReplicateJobIfComplete } from '@/lib/ai/complete-ai-job';
import { createSignedUrl } from '@/lib/supabase/storage';
import type { ImageJobRow, UserRow } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function resolveAuth(req: NextRequest): Promise<{ user: UserRow } | NextResponse> {
  const apiAuth = await authenticateApiKey(req.headers.get('authorization'));
  if (apiAuth) return { user: apiAuth.user };

  return NextResponse.json(
    { error: 'Use Authorization: Bearer pf_live_... (Pro API key required).' },
    { status: 401 }
  );
}

/** GET job status — Pro API */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await resolveAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const admin = createAdminClient();
  const { data: job } = await admin.from('image_jobs').select('*').eq('id', id).single();

  if (!job || job.user_id !== auth.user.id) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  }

  let jobRow = job as ImageJobRow;

  if (jobRow.status === 'processing') {
    await syncReplicateJobIfComplete(jobRow);
    const { data: refreshed } = await admin.from('image_jobs').select('*').eq('id', id).single();
    if (refreshed) jobRow = refreshed as ImageJobRow;
  }

  let previewUrl: string | null = null;

  if (jobRow.status === 'done' && jobRow.preview_asset_id) {
    const { data: asset } = await admin
      .from('image_assets')
      .select('*, storage_files(*)')
      .eq('id', jobRow.preview_asset_id)
      .single();
    if (asset?.storage_files) {
      previewUrl = await createSignedUrl(asset.storage_files.bucket, asset.storage_files.storage_path, 600);
    }
  }

  return NextResponse.json({
    id: jobRow.id,
    status: jobRow.status,
    errorMessage: jobRow.error_message,
    previewUrl,
    commercialLicense: planHasFeature(auth.user.plan, 'commercialLicense'),
  });
}

/** POST process job — Pro API (same pipeline as UI) */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await resolveAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const admin = createAdminClient();
  const { data: job } = await admin.from('image_jobs').select('*').eq('id', id).single();

  if (!job || job.user_id !== auth.user.id) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  }

  const jobRow = job as ImageJobRow;
  if (jobRow.status !== 'pending') {
    return NextResponse.json({ error: `Job is already ${jobRow.status}.` }, { status: 400 });
  }

  const tool = getToolById(jobRow.tool_id);
  if (!tool) {
    return NextResponse.json({ error: 'Tool not found.' }, { status: 404 });
  }

  const { data: inputAsset } = await admin
    .from('image_assets')
    .select('*, storage_files(*)')
    .eq('id', jobRow.input_asset_id)
    .single();

  if (!inputAsset?.storage_files) {
    return NextResponse.json({ error: 'Input asset missing.' }, { status: 400 });
  }

  const inputUrl = await createSignedUrl(
    inputAsset.storage_files.bucket,
    inputAsset.storage_files.storage_path,
    600
  );

  await admin.from('image_jobs').update({ status: 'processing' }).eq('id', jobRow.id);

  const processor = getProcessor(tool);
  const result = await processor.process({ job: jobRow, tool, inputAssetUrl: inputUrl });
  const user = auth.user;
  const isFreePlan = user.plan === 'free';

  if (result.status === 'failed') {
    await admin
      .from('image_jobs')
      .update({ status: 'failed', error_message: result.error || 'Processing failed.' })
      .eq('id', jobRow.id);
    await refundFailedJob(user, jobRow);
    return NextResponse.json({ status: 'failed', error: result.error }, { status: 500 });
  }

  if (result.status === 'processing') {
    return NextResponse.json({ status: 'processing', providerJobId: result.providerJobId });
  }

  if (result.status === 'done' && result.outputBuffer && result.outputMimeType) {
    const finalized = await finalizeJobOutput({
      userId: user.id,
      jobId: jobRow.id,
      outputBuffer: result.outputBuffer,
      outputMimeType: result.outputMimeType,
      isFreePlan,
      toolType: tool.type,
      toolCategory: tool.category,
    });
    await chargeJobOnCompletion(user, jobRow);
    return NextResponse.json({
      status: 'done',
      previewUrl: finalized.previewUrl,
      commercialLicense: planHasFeature(user.plan, 'commercialLicense'),
    });
  }

  return NextResponse.json({ error: 'Unexpected processor result.' }, { status: 500 });
}
