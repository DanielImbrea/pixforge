import { applyUpscalePostProcess } from '@/lib/ai/upscale-post-process';
import { finalizeBgRemovalOutput } from '@/lib/ai/bg-removal-post-process';
import { fetchAsBuffer } from '@/lib/ai/fetch-image';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getToolById } from '@/lib/tools/registry';
import { getProcessor } from '@/lib/tools/get-processor';
import { finalizeJobOutput } from '@/lib/tools/finalize-job-output';
import { createSignedUrl } from '@/lib/supabase/storage';
import { getReplicateInputUrlTtlSeconds } from '@/lib/ai/config';
import { chargeJobOnCompletion, canDownloadHd, refundFailedJob } from '@/lib/billing/entitlements';
import type { ImageJobRow, UserRow } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

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

  const inputUrlTtl = tool.type === 'ai' ? getReplicateInputUrlTtlSeconds() : 300;
  const inputAssetUrl = await createSignedUrl(
    inputAsset.storage_files.bucket,
    inputAsset.storage_files.storage_path,
    inputUrlTtl
  );

  let jobForProcess = jobRow;
  const existingParams = (jobRow.params || {}) as Record<string, unknown>;
  if (tool.category === 'faces' && existingParams.referenceAssetId) {
    const { data: refAsset } = await admin
      .from('image_assets')
      .select('*, storage_files(*)')
      .eq('id', existingParams.referenceAssetId as string)
      .single();
    if (refAsset?.storage_files) {
      const refUrl = await createSignedUrl(
        refAsset.storage_files.bucket,
        refAsset.storage_files.storage_path,
        inputUrlTtl
      );
      jobForProcess = {
        ...jobRow,
        params: { ...existingParams, _referenceAssetUrl: refUrl },
      };
    }
  }

  await admin.from('image_jobs').update({ status: 'processing' }).eq('id', jobRow.id);

  const processor = getProcessor(tool);
  const result = await processor.process({ job: jobForProcess, tool, inputAssetUrl });

  if (result.status === 'failed') {
    await admin
      .from('image_jobs')
      .update({ status: 'failed', error_message: result.error || 'Processing failed.' })
      .eq('id', jobRow.id);
    await refundFailedJob(user, jobRow);
    return NextResponse.json(
      { error: result.error || 'Processing failed.', errorKey: result.errorKey },
      { status: 500 }
    );
  }

  if (result.status === 'processing') {
    const nextParams = {
      ...(jobRow.params || {}),
      ...(result.upscaleRouting ? { _upscaleRouting: result.upscaleRouting } : {}),
      ...(result.bgRemovalRouting ? { _bgRemovalRouting: result.bgRemovalRouting } : {}),
      ...(result.blurFacesRouting ? { _blurFacesRouting: result.blurFacesRouting } : {}),
    };

    await admin
      .from('image_jobs')
      .update({
        provider_job_id: result.providerJobId || null,
        params: nextParams,
      })
      .eq('id', jobRow.id);
    return NextResponse.json({ status: 'processing' });
  }

  let outputBuffer = result.outputBuffer;
  let bgShadowRecoveryApplied = false;
  if (tool.category === 'upscale' && result.upscaleRouting && outputBuffer) {
    outputBuffer = await applyUpscalePostProcess(outputBuffer, result.upscaleRouting.postProcess);
  }
  if (tool.category === 'background' && result.bgRemovalRouting && outputBuffer) {
    const shadowRecovery = Boolean((jobRow.params as Record<string, unknown> | undefined)?.shadowRecovery);
    let originalBuffer: Buffer | undefined;
    if (shadowRecovery) {
      try {
        originalBuffer = await fetchAsBuffer(inputAssetUrl);
      } catch (err) {
        console.warn(`[process] shadow recovery skipped job=${jobRow.id}`, err);
      }
    }
    const finalized = await finalizeBgRemovalOutput(outputBuffer, result.bgRemovalRouting, {
      shadowRecovery,
      originalBuffer,
    });
    outputBuffer = finalized.buffer;
    bgShadowRecoveryApplied = finalized.shadowRecoveryApplied;
  }

  if (!outputBuffer || !result.outputMimeType) {
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
    outputBuffer,
    outputMimeType: result.outputMimeType,
    isFreePlan: user.plan === 'free',
    toolType: tool.type,
    toolCategory: tool.category,
    existingParams: (jobRow.params || {}) as Record<string, unknown>,
    deliveryMeta: {
      outputFormat: result.outputFormat,
      outputFormatLabel: result.outputFormatLabel,
      outputEncodeQuality: result.outputEncodeQuality,
      backgroundFillApplied: result.backgroundFillApplied,
      smartFormatSelected: result.smartFormatSelected,
      contentKind: result.contentKind,
      formatReasonKey: result.formatReasonKey,
      compressionLevel: result.compressionLevel,
      sizeReductionPercent: result.sizeReductionPercent,
      inputSizeBytes: result.inputSizeBytes,
      keptOriginal: result.keptOriginal,
      upscaleReasonKey: result.upscaleReasonKey,
      upscaleWarningKey: result.upscaleWarningKey,
      upscaleModelLabel: result.upscaleModelLabel,
      upscaleEffectiveScale: result.upscaleEffectiveScale,
      upscaleSmartMode: result.upscaleSmartMode,
      bgRemovalReasonKey: result.bgRemovalReasonKey,
      bgRemovalModelLabel: result.bgRemovalModelLabel,
      bgRemovalSubjectMode: result.bgRemovalSubjectMode,
      bgRemovalEdgeQuality: result.bgRemovalEdgeQuality,
      bgRemovalSmartMode: result.bgRemovalSmartMode,
      bgRemovalShadowRecoveryApplied: bgShadowRecoveryApplied,
      blurFacesReasonKey: result.blurFacesReasonKey,
      blurFacesModelLabel: result.blurFacesModelLabel,
    },
  });

  await chargeJobOnCompletion(user, jobRow);

  return NextResponse.json({
    status: 'done',
    previewUrl: finalized.previewUrl,
    canDownloadHd: canDownloadHd(user),
    outputWidth: finalized.outputWidth,
    outputHeight: finalized.outputHeight,
    outputSizeBytes: finalized.outputSizeBytes,
    outputFormat: result.outputFormat,
    outputFormatLabel: result.outputFormatLabel,
    outputEncodeQuality: result.outputEncodeQuality,
    backgroundFillApplied: result.backgroundFillApplied,
    smartFormatSelected: result.smartFormatSelected,
    contentKind: result.contentKind,
    formatReasonKey: result.formatReasonKey,
    compressionLevel: result.compressionLevel,
    sizeReductionPercent: result.sizeReductionPercent,
    inputSizeBytes: result.inputSizeBytes,
    upscaleReasonKey: result.upscaleReasonKey,
    upscaleWarningKey: result.upscaleWarningKey,
    upscaleModelLabel: result.upscaleModelLabel,
    upscaleEffectiveScale: result.upscaleEffectiveScale,
    upscaleSmartMode: result.upscaleSmartMode,
    bgRemovalReasonKey: result.bgRemovalReasonKey,
    bgRemovalModelLabel: result.bgRemovalModelLabel,
    bgRemovalSubjectMode: result.bgRemovalSubjectMode,
    bgRemovalEdgeQuality: result.bgRemovalEdgeQuality,
    bgRemovalSmartMode: result.bgRemovalSmartMode,
    bgRemovalShadowRecoveryApplied: bgShadowRecoveryApplied,
    blurFacesReasonKey: result.blurFacesReasonKey,
    blurFacesModelLabel: result.blurFacesModelLabel,
  });
}
