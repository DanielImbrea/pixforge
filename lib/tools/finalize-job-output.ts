import { createAdminClient } from '@/lib/supabase/admin';
import { uploadBufferToStorage, createSignedUrl } from '@/lib/supabase/storage';
import { applyWatermark } from '@/lib/watermark/apply-watermark';
import { postProcessOutput } from '@/lib/tools/post-process-output';
import type { ToolCategory, ToolType } from '@/types';

export interface FinalizeJobOutputInput {
  userId: string;
  jobId: string;
  outputBuffer: Buffer;
  outputMimeType: string;
  isFreePlan: boolean;
  toolType: ToolType;
  toolCategory: ToolCategory;
}

export interface FinalizeJobOutputResult {
  previewUrl: string;
  outputAssetId: string;
}

export async function finalizeJobOutput(opts: FinalizeJobOutputInput): Promise<FinalizeJobOutputResult> {
  const admin = createAdminClient();

  const { buffer: optimizedBuffer, mimeType: optimizedMimeType } = await postProcessOutput(
    opts.outputBuffer,
    opts.outputMimeType,
    opts.toolType,
    opts.toolCategory,
    { jobId: opts.jobId, toolCategory: opts.toolCategory }
  );

  const { storagePath: outputPath } = await uploadBufferToStorage(
    optimizedBuffer,
    'outputs',
    opts.userId,
    optimizedMimeType
  );

  const { data: outputStorageFile, error: outputStorageError } = await admin
    .from('storage_files')
    .insert({
      user_id: opts.userId,
      bucket: 'outputs',
      storage_path: outputPath,
      mime_type: optimizedMimeType,
      size_bytes: optimizedBuffer.byteLength,
    })
    .select('*')
    .single();

  if (outputStorageError || !outputStorageFile) {
    throw new Error('Failed to record output storage file.');
  }

  const { data: outputAsset, error: outputAssetError } = await admin
    .from('image_assets')
    .insert({
      user_id: opts.userId,
      storage_file_id: outputStorageFile.id,
      asset_type: 'output',
      is_watermarked: false,
    })
    .select('*')
    .single();

  if (outputAssetError || !outputAsset) {
    throw new Error('Failed to record output asset.');
  }

  const previewBuffer = opts.isFreePlan
    ? await applyWatermark(optimizedBuffer, optimizedMimeType)
    : optimizedBuffer;

  const { storagePath: previewPath } = await uploadBufferToStorage(
    previewBuffer,
    'previews',
    opts.userId,
    optimizedMimeType
  );

  const { data: previewStorageFile, error: previewStorageError } = await admin
    .from('storage_files')
    .insert({
      user_id: opts.userId,
      bucket: 'previews',
      storage_path: previewPath,
      mime_type: optimizedMimeType,
      size_bytes: previewBuffer.byteLength,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('*')
    .single();

  if (previewStorageError || !previewStorageFile) {
    throw new Error('Failed to record preview storage file.');
  }

  const { data: previewAsset, error: previewAssetError } = await admin
    .from('image_assets')
    .insert({
      user_id: opts.userId,
      storage_file_id: previewStorageFile.id,
      asset_type: 'preview',
      is_watermarked: opts.isFreePlan,
    })
    .select('*')
    .single();

  if (previewAssetError || !previewAsset) {
    throw new Error('Failed to record preview asset.');
  }

  await admin
    .from('image_jobs')
    .update({
      status: 'done',
      output_asset_id: outputAsset.id,
      preview_asset_id: previewAsset.id,
      completed_at: new Date().toISOString(),
    })
    .eq('id', opts.jobId);

  const previewUrl = await createSignedUrl('previews', previewPath, 600);

  return { previewUrl, outputAssetId: outputAsset.id };
}
