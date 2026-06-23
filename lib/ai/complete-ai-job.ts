import { createAdminClient } from '@/lib/supabase/admin';
import { incrementUsage } from '@/lib/billing/entitlements';
import { finalizeJobOutput } from '@/lib/tools/finalize-job-output';
import { getToolById } from '@/lib/tools/registry';
import { fetchImageBuffer } from '@/lib/ai/fetch-image';
import {
  extractReplicateOutputUrl,
  getReplicatePrediction,
  type ReplicatePrediction,
} from '@/lib/ai/replicate-client';
import { getAiProvider } from '@/lib/ai/config';
import type { ImageJobRow, UserRow } from '@/types';

export async function failAiJob(jobId: string, errorMessage: string): Promise<void> {
  const admin = createAdminClient();
  const { data: job } = await admin.from('image_jobs').select('status').eq('id', jobId).maybeSingle();
  if (!job || job.status === 'done' || job.status === 'failed') {
    return;
  }
  await admin
    .from('image_jobs')
    .update({ status: 'failed', error_message: errorMessage })
    .eq('id', jobId);
}

export async function completeAiJobFromOutputBuffer(
  jobId: string,
  outputBuffer: Buffer,
  outputMimeType: string
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

  await finalizeJobOutput({
    userId: user.id,
    jobId: jobRow.id,
    outputBuffer,
    outputMimeType,
    isFreePlan: user.plan === 'free',
    toolType: tool.type,
    toolCategory: tool.category,
  });

  await incrementUsage(user, jobRow.units_cost);
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
    await failAiJob(jobId, prediction.error || 'Replicate prediction failed.');
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
    console.error(`[replicate] sync failed job=${jobRow.id}`, err);
  }
}
