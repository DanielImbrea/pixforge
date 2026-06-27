import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getToolById } from '@/lib/tools/registry';
import { validateUploadBuffer, normalizeImageBuffer, ValidationError } from '@/lib/validation/upload';
import { reserveCredits, QuotaExceededError, PlanRestrictedError, refundCredits } from '@/lib/billing/entitlements';
import { getMaxResizeQuality } from '@/lib/billing/plan-features';
import { clampResizeQuality } from '@/lib/tools/resize-params';
import { uploadBufferToStorage } from '@/lib/supabase/storage';
import { checkRateLimit, getClientIp, maybeCleanupRateLimitStore } from '@/lib/security/rate-limit';
import { bgRemovalParamsSchema, convertParamsSchema, resizeParamsSchema, upscaleParamsSchema, cropParamsSchema, blurFacesParamsSchema } from '@/lib/validation/schemas';
import sharp from 'sharp';
import type { ToolDefinition, UserRow } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

function parseToolParams(tool: ToolDefinition, paramsRaw: FormDataEntryValue | null): Record<string, unknown> {
  if (typeof paramsRaw !== 'string') {
    if (tool.category === 'resize') {
      throw new ValidationError('Width or height is required for resize.');
    }
    if (tool.category === 'upscale') {
      return { scale: 'smart' };
    }
    if (tool.category === 'background') {
      return { subjectMode: 'auto', edgeQuality: 'high' };
    }
    if (tool.category === 'faces') {
      return { detectionMode: 'automatic', blurStrength: 'medium', customAction: 'blur' };
    }
    return {};
  }

  let candidate: unknown;
  try {
    candidate = JSON.parse(paramsRaw);
  } catch {
    throw new ValidationError('Invalid processing parameters.');
  }

  if (tool.category === 'resize') {
    const result = resizeParamsSchema.safeParse(candidate);
    if (!result.success) {
      throw new ValidationError('Width and height must be positive numbers up to 10,000 px.');
    }
    if (!result.data.width && !result.data.height) {
      throw new ValidationError('Width or height is required for resize.');
    }
    const targetFormat = result.data.targetFormat === 'jpg' ? 'jpeg' : result.data.targetFormat;
    return {
      width: result.data.width,
      height: result.data.height,
      maintainAspectRatio: result.data.maintainAspectRatio ?? true,
      targetFormat,
      quality: result.data.quality,
    };
  }

  if (tool.category === 'upscale') {
    const result = upscaleParamsSchema.safeParse(candidate);
    if (!result.success) {
      throw new ValidationError('Invalid upscale quality selected.');
    }
    return result.data;
  }

  if (tool.category === 'background') {
    const result = bgRemovalParamsSchema.safeParse(candidate);
    if (!result.success) {
      throw new ValidationError('Invalid background removal options selected.');
    }
    return result.data;
  }

  if (tool.category === 'convert') {
    const result = convertParamsSchema.safeParse(candidate);
    if (!result.success) {
      throw new ValidationError('Invalid optimizer options selected.');
    }
    const targetFormat = result.data.targetFormat === 'jpg' ? 'jpeg' : result.data.targetFormat;
    return {
      targetFormat,
      qualityIntent: result.data.qualityIntent,
      backgroundFill: result.data.backgroundFill,
    };
  }

  if (tool.category === 'crop') {
    const result = cropParamsSchema.safeParse(candidate);
    if (!result.success) {
      throw new ValidationError('Invalid crop options selected.');
    }
    if (result.data.width < 1 || result.data.height < 1) {
      throw new ValidationError('Crop area is required.');
    }
    return result.data;
  }

  if (tool.category === 'faces') {
    const result = blurFacesParamsSchema.safeParse(candidate);
    if (!result.success) {
      throw new ValidationError('Invalid blur faces options selected.');
    }
    return result.data;
  }

  return {};
}

export async function POST(req: NextRequest) {
  maybeCleanupRateLimitStore();

  const ip = getClientIp(req);
  const ipLimit = checkRateLimit(`upload:ip:${ip}`, 30, 60_000);
  if (!ipLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
  }

  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      const userLimit = checkRateLimit(`upload:user:${authUser.id}`, 20, 60_000);
      if (!userLimit.allowed) {
        return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
      }
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const toolId = formData.get('toolId');

    if (!(file instanceof File) || typeof toolId !== 'string') {
      return NextResponse.json({ error: 'Missing file or toolId.' }, { status: 400 });
    }

    const tool = getToolById(toolId);
    if (!tool || !tool.enabled) {
      return NextResponse.json({ error: 'Unknown tool.' }, { status: 404 });
    }

    const admin = createAdminClient();
    let user: UserRow;

    if (authUser) {
      const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single();
      if (!profile) {
        return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
      }
      user = profile as UserRow;
    } else {
      return NextResponse.json({ error: 'Please sign in to use this tool.' }, { status: 401 });
    }

    await reserveCredits(user, tool);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await validateUploadBuffer(buffer, file.type, user, tool);
    const normalizedBuffer = await normalizeImageBuffer(buffer);
    const metadata = await sharp(normalizedBuffer).metadata();

    const { storagePath, bucket } = await uploadBufferToStorage(
      normalizedBuffer,
      'uploads',
      user.id,
      file.type
    );

    const { data: storageFile, error: storageFileError } = await admin
      .from('storage_files')
      .insert({
        user_id: user.id,
        bucket,
        storage_path: storagePath,
        mime_type: file.type,
        size_bytes: normalizedBuffer.byteLength,
        width_px: metadata.width,
        height_px: metadata.height,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('*')
      .single();

    if (storageFileError || !storageFile) {
      return NextResponse.json({ error: 'Failed to record uploaded file.' }, { status: 500 });
    }

    const { data: imageAsset, error: imageAssetError } = await admin
      .from('image_assets')
      .insert({
        user_id: user.id,
        storage_file_id: storageFile.id,
        asset_type: 'input',
        is_watermarked: false,
      })
      .select('*')
      .single();

    if (imageAssetError || !imageAsset) {
      return NextResponse.json({ error: 'Failed to record input asset.' }, { status: 500 });
    }

    const parsedParams = parseToolParams(tool, formData.get('params'));
    let jobParams =
      tool.category === 'resize' && typeof parsedParams.quality === 'number'
        ? {
            ...parsedParams,
            quality: clampResizeQuality(parsedParams.quality, getMaxResizeQuality(user.plan)),
          }
        : parsedParams;

    const referenceFile = formData.get('referenceFile');
    if (referenceFile instanceof File && tool.category === 'faces') {
      const refBuffer = Buffer.from(await referenceFile.arrayBuffer());
      await validateUploadBuffer(refBuffer, referenceFile.type, user, tool);
      const refNormalized = await normalizeImageBuffer(refBuffer);
      const refMeta = await sharp(refNormalized).metadata();
      const { storagePath: refPath, bucket: refBucket } = await uploadBufferToStorage(
        refNormalized,
        'uploads',
        user.id,
        referenceFile.type
      );
      const { data: refStorageFile } = await admin
        .from('storage_files')
        .insert({
          user_id: user.id,
          bucket: refBucket,
          storage_path: refPath,
          mime_type: referenceFile.type,
          size_bytes: refNormalized.byteLength,
          width_px: refMeta.width,
          height_px: refMeta.height,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select('*')
        .single();
      if (refStorageFile) {
        const { data: refAsset } = await admin
          .from('image_assets')
          .insert({
            user_id: user.id,
            storage_file_id: refStorageFile.id,
            asset_type: 'input',
            is_watermarked: false,
          })
          .select('*')
          .single();
        if (refAsset) {
          jobParams = { ...jobParams, referenceAssetId: refAsset.id };
        }
      }
    }

    if (
      tool.category === 'faces' &&
      jobParams.detectionMode === 'custom' &&
      !jobParams.referenceAssetId
    ) {
      await refundCredits(user, tool.creditsCost);
      throw new ValidationError('Reference portrait is required for custom detection.');
    }

    let job;
    try {
      const { data: createdJob, error: jobError } = await supabase
        .from('image_jobs')
        .insert({
          user_id: user.id,
          tool_id: tool.id,
          input_asset_id: imageAsset.id,
          status: 'pending',
          params: jobParams,
          units_cost: tool.creditsCost,
          credits_charged: true,
        })
        .select('*')
        .single();

      if (jobError || !createdJob) {
        throw new Error(jobError?.message || 'Failed to create job.');
      }
      job = createdJob;
    } catch (jobErr) {
      await refundCredits(user, tool.creditsCost);
      throw jobErr;
    }

    return NextResponse.json({ jobId: job.id });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof QuotaExceededError) {
      return NextResponse.json(
        {
          error: `Not enough credits. This tool needs ${err.needed} credit(s); you have ${err.remaining} remaining.`,
        },
        { status: 402 }
      );
    }
    if (err instanceof PlanRestrictedError) {
      return NextResponse.json({ error: 'This tool is not available on your plan.' }, { status: 403 });
    }
    const message = err instanceof Error ? err.message : 'Unknown error during upload.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
