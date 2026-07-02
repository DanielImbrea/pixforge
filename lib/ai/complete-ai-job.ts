import { createAdminClient } from '@/lib/supabase/admin';
import { chargeJobOnCompletion, refundFailedJob } from '@/lib/billing/entitlements';
import { finalizeJobOutput } from '@/lib/tools/finalize-job-output';
import { getToolById } from '@/lib/tools/registry';
import { fetchAsBuffer, fetchImageBuffer } from '@/lib/ai/fetch-image';
import { applyMockAiTransform } from '@/lib/ai/mock-provider';
import { applyMockPortraitEnhance } from '@/lib/ai/portrait-enhance-process';
import { applyMockObjectRemove } from '@/lib/ai/object-remove-inpaint';
import type { PortraitEnhanceRouting } from '@/lib/ai/portrait-enhance-routing';
import { createSignedUrl } from '@/lib/supabase/storage';
import {
  extractReplicateOutputUrl,
  getReplicatePrediction,
  type ReplicatePrediction,
} from '@/lib/ai/replicate-client';
import { applyUpscalePostProcess } from '@/lib/ai/upscale-post-process';
import { finalizeBgRemovalOutput } from '@/lib/ai/bg-removal-post-process';
import { finalizeBgReplaceOutput } from '@/lib/ai/bg-replace-post-process';
import { fetchJobInputBuffer } from '@/lib/ai/fetch-job-input';
import { bgReplaceParamsSchema } from '@/lib/validation/schemas';
import { DEFAULT_BG_REPLACE_PARAMS } from '@/lib/tools/bg-replace-params';
import type { UpscaleRouting } from '@/lib/ai/upscale-routing';
import type { BgRemovalRouting } from '@/lib/ai/bg-removal-routing';
import type { BlurFacesRouting } from '@/lib/ai/blur-faces-routing';
import { getAiProvider } from '@/lib/ai/config';
import { mapBlurFacesUserError } from '@/lib/ai/replicate-errors';
import type { ImageJobRow, UserRow } from '@/types';

export async function failAiJob(jobId: string, errorMessage: string): Promise<void> {
  const admin = createAdminClient();
  const { data: job } = await admin.from('image_jobs').select('*').eq('id', jobId).maybeSingle();
  if (!job || job.status === 'done' || job.status === 'failed') {
    return;
  }

  const jobRow = job as ImageJobRow;
  await admin
    .from('image_jobs')
    .update({ status: 'failed', error_message: errorMessage })
    .eq('id', jobId);

  const { data: userRow } = await admin.from('users').select('*').eq('id', jobRow.user_id).single();
  if (userRow) {
    await refundFailedJob(userRow as UserRow, jobRow);
  }
}

export async function completeAiJobFromOutputBuffer(
  jobId: string,
  outputBuffer: Buffer,
  outputMimeTypeInput: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { data: job } = await admin.from('image_jobs').select('*').eq('id', jobId).single();
  if (!job) {
    return false;
  }
  const jobRow = job as ImageJobRow;
  if (jobRow.status === 'done' || jobRow.status === 'failed') {
    return false;
  }

  const { data: userRow } = await admin.from('users').select('*').eq('id', jobRow.user_id).single();
  if (!userRow) {
    throw new Error('User not found for job.');
  }
  const user = userRow as UserRow;

  const tool = getToolById(jobRow.tool_id);
  if (!tool) {
    throw new Error('Tool not found for job.');
  }

  const upscaleRouting = (jobRow.params as Record<string, unknown> | undefined)?._upscaleRouting as
    | UpscaleRouting
    | undefined;
  const bgRouting = (jobRow.params as Record<string, unknown> | undefined)?._bgRemovalRouting as
    | BgRemovalRouting
    | undefined;
  const blurFacesRouting = (jobRow.params as Record<string, unknown> | undefined)
    ?._blurFacesRouting as BlurFacesRouting | undefined;

  const portraitEnhanceRouting = (jobRow.params as Record<string, unknown> | undefined)
    ?._portraitEnhanceRouting as import('@/lib/ai/portrait-enhance-routing').PortraitEnhanceRouting | undefined;

  let processedBuffer = outputBuffer;
  let outputMimeType = outputMimeTypeInput;
  let bgShadowRecoveryApplied = false;
  let bgReplaceBackgroundLabel: string | undefined;
  let bgReplaceUsedAiGeneration = false;
  if (tool.category === 'upscale' && upscaleRouting) {
    processedBuffer = await applyUpscalePostProcess(processedBuffer, upscaleRouting.postProcess);
  }
  if (tool.category === 'background' && bgRouting) {
    const shadowRecovery = Boolean((jobRow.params as Record<string, unknown> | undefined)?.shadowRecovery);
    let originalBuffer: Buffer | undefined;
    if (shadowRecovery) {
      try {
        originalBuffer = await fetchJobInputBuffer(jobRow);
      } catch (err) {
        console.warn(`[ai-job] shadow recovery skipped job=${jobId}`, err);
      }
    }
    const finalized = await finalizeBgRemovalOutput(processedBuffer, bgRouting, {
      shadowRecovery,
      originalBuffer,
    });
    processedBuffer = finalized.buffer;
    bgShadowRecoveryApplied = finalized.shadowRecoveryApplied;
  }
  if (tool.category === 'background_replace' && bgRouting) {
    const parsed = bgReplaceParamsSchema.safeParse(jobRow.params || {});
    const bgReplaceParams = parsed.success ? parsed.data : DEFAULT_BG_REPLACE_PARAMS;
    const finalized = await finalizeBgReplaceOutput(processedBuffer, bgReplaceParams);
    processedBuffer = finalized.buffer;
    outputMimeType = 'image/jpeg';
    bgReplaceBackgroundLabel = finalized.backgroundLabel;
    bgReplaceUsedAiGeneration = finalized.usedAiGeneration;
  }

  const deliveryMeta =
    upscaleRouting ||
    bgRouting ||
    blurFacesRouting ||
    portraitEnhanceRouting ||
    tool.category === 'object_remove'
      ? {
          ...(upscaleRouting
            ? {
                contentKind: upscaleRouting.contentKind,
                upscaleReasonKey: upscaleRouting.reasonKey,
                upscaleWarningKey: upscaleRouting.warningKey,
                upscaleModelLabel: upscaleRouting.modelLabel,
                upscaleEffectiveScale: upscaleRouting.scale,
                upscaleSmartMode: upscaleRouting.smartMode,
              }
            : {}),
          ...(bgRouting
            ? {
                contentKind: bgRouting.subjectMode,
                bgRemovalReasonKey: bgRouting.reasonKey,
                bgRemovalModelLabel: bgRouting.modelLabel,
                bgRemovalSubjectMode: bgRouting.subjectMode,
                bgRemovalEdgeQuality: bgRouting.edgeQuality,
                bgRemovalSmartMode: bgRouting.smartMode,
                bgRemovalShadowRecoveryApplied: bgShadowRecoveryApplied,
                ...(bgReplaceBackgroundLabel
                  ? {
                      bgReplaceBackgroundLabel,
                      bgReplaceUsedAiGeneration,
                    }
                  : {}),
              }
            : {}),
          ...(blurFacesRouting
            ? {
                blurFacesReasonKey: blurFacesRouting.reasonKey,
                blurFacesModelLabel: blurFacesRouting.modelLabel,
              }
            : {}),
          ...(portraitEnhanceRouting
            ? {
                portraitEnhanceReasonKey: portraitEnhanceRouting.reasonKey,
                portraitEnhanceWarningKey: portraitEnhanceRouting.warningKey,
                portraitEnhanceModelLabel: portraitEnhanceRouting.modelLabel,
                portraitEnhanceStyle: portraitEnhanceRouting.enhanceStyle,
              }
            : {}),
          ...(tool.category === 'object_remove' ? { objectRemoveComplete: true } : {}),
        }
      : undefined;

  await finalizeJobOutput({
    userId: user.id,
    jobId: jobRow.id,
    outputBuffer: processedBuffer,
    outputMimeType,
    isFreePlan: user.plan === 'free',
    toolType: tool.type,
    toolCategory: tool.category,
    existingParams: (jobRow.params || {}) as Record<string, unknown>,
    deliveryMeta,
  });

  await chargeJobOnCompletion(user, jobRow);
  console.log(`[ai-job] completed job=${jobId} tool=${tool.id} user=${user.id}`);
  return true;
}

export async function handleReplicatePrediction(
  jobId: string,
  prediction: ReplicatePrediction
): Promise<void> {
  const admin = createAdminClient();

  const { data: job } = await admin.from('image_jobs').select('*').eq('id', jobId).single();
  if (!job) {
    throw new Error('Job not found.');
  }
  const jobRow = job as ImageJobRow;

  if (jobRow.status === 'done' || jobRow.status === 'failed') {
    return;
  }

  if (jobRow.provider_job_id && prediction.id !== jobRow.provider_job_id) {
    throw new Error('Prediction id does not match job provider_job_id.');
  }

  if (!jobRow.provider_job_id) {
    await admin.from('image_jobs').update({ provider_job_id: prediction.id }).eq('id', jobId);
  }

  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    const tool = getToolById(jobRow.tool_id);
    const errorMessage =
      tool?.category === 'faces'
        ? mapBlurFacesUserError(prediction.error)
        : prediction.error || 'Replicate prediction failed.';
    await failAiJob(jobId, errorMessage);
    return;
  }

  if (prediction.status !== 'succeeded') {
    return;
  }

  const outputUrl = extractReplicateOutputUrl(prediction.output);
  if (!outputUrl) {
    await failAiJob(jobId, 'Replicate returned no downloadable output.');
    return;
  }

  const { buffer, mimeType } = await fetchImageBuffer(outputUrl);
  await completeAiJobFromOutputBuffer(jobId, buffer, mimeType);
}

/** Poll Replicate when webhook is delayed or missed (client already polls job status). */
export async function syncReplicateJobIfComplete(jobRow: ImageJobRow): Promise<void> {
  if (getAiProvider() !== 'replicate') {
    return;
  }
  if (jobRow.status !== 'processing' || !jobRow.provider_job_id) {
    return;
  }

  try {
    const prediction = await getReplicatePrediction(jobRow.provider_job_id);
    if (prediction.status === 'starting' || prediction.status === 'processing') {
      return;
    }
    await handleReplicatePrediction(jobRow.id, prediction);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Replicate sync failed';
    console.error(`[replicate] sync failed job=${jobRow.id}`, message);
    await failAiJob(jobRow.id, message);
  }
}

/** Recover mock jobs stuck in processing from the old async webhook flow. */
export async function syncMockJobIfComplete(jobRow: ImageJobRow): Promise<void> {
  if (getAiProvider() !== 'mock') {
    return;
  }
  if (jobRow.status !== 'processing') {
    return;
  }

  const tool = getToolById(jobRow.tool_id);
  if (!tool) {
    await failAiJob(jobRow.id, 'Tool not found.');
    return;
  }

  try {
    const admin = createAdminClient();
    const { data: inputAsset } = await admin
      .from('image_assets')
      .select('*, storage_files(*)')
      .eq('id', jobRow.input_asset_id)
      .single();

    if (!inputAsset?.storage_files) {
      await failAiJob(jobRow.id, 'Input asset missing.');
      return;
    }

    const inputUrl = await createSignedUrl(
      inputAsset.storage_files.bucket,
      inputAsset.storage_files.storage_path,
      600
    );
    const inputBuffer = await fetchAsBuffer(inputUrl);

    if (tool.category === 'object_remove') {
      const maskAssetId = (jobRow.params as Record<string, unknown> | undefined)?.maskAssetId as
        | string
        | undefined;
      if (!maskAssetId) {
        await failAiJob(jobRow.id, 'Mask asset missing.');
        return;
      }
      const { data: maskAsset } = await admin
        .from('image_assets')
        .select('*, storage_files(*)')
        .eq('id', maskAssetId)
        .single();
      if (!maskAsset?.storage_files) {
        await failAiJob(jobRow.id, 'Mask asset missing.');
        return;
      }
      const maskUrl = await createSignedUrl(
        maskAsset.storage_files.bucket,
        maskAsset.storage_files.storage_path,
        600
      );
      const maskBuffer = await fetchAsBuffer(maskUrl);
      const buffer = await applyMockObjectRemove(inputBuffer, maskBuffer);
      await completeAiJobFromOutputBuffer(jobRow.id, buffer, 'image/jpeg');
      return;
    }

    if (tool.category === 'portrait_enhance') {
      const routing = (jobRow.params as Record<string, unknown> | undefined)?._portraitEnhanceRouting as
        | PortraitEnhanceRouting
        | undefined;
      const buffer = await applyMockPortraitEnhance(inputBuffer, routing?.enhanceStyle ?? 'natural');
      const sharp = (await import('sharp')).default;
      const meta = await sharp(inputBuffer).rotate().metadata();
      const mimeType =
        meta.format === 'png'
          ? 'image/png'
          : meta.format === 'webp'
            ? 'image/webp'
            : 'image/jpeg';
      await completeAiJobFromOutputBuffer(jobRow.id, buffer, mimeType);
      return;
    }

    const modelId =
      tool.category === 'background' || tool.category === 'background_replace'
        ? 'mock-bg-removal'
        : tool.category === 'faces'
          ? 'mock-blur-faces'
          : 'mock-upscale';
    const { buffer, mimeType } = await applyMockAiTransform(
      inputBuffer,
      modelId,
      (jobRow.params || {}) as Record<string, unknown>
    );

    await completeAiJobFromOutputBuffer(jobRow.id, buffer, mimeType);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Mock AI sync failed';
    console.error(`[mock-ai] sync failed job=${jobRow.id}`, message);
    await failAiJob(jobRow.id, message);
  }
}
