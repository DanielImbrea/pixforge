import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getToolById } from '@/lib/tools/registry';
import { validateUploadBuffer, normalizeImageBuffer, ValidationError } from '@/lib/validation/upload';
import { checkQuota, QuotaExceededError, PlanRestrictedError } from '@/lib/billing/entitlements';
import { uploadBufferToStorage } from '@/lib/supabase/storage';
import { checkRateLimit, getClientIp, maybeCleanupRateLimitStore } from '@/lib/security/rate-limit';
import { resizeParamsSchema, upscaleParamsSchema } from '@/lib/validation/schemas';
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
      return { scale: 2 };
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
    return result.data;
  }

  if (tool.category === 'upscale') {
    const result = upscaleParamsSchema.safeParse(candidate);
    if (!result.success) {
      throw new ValidationError('Invalid upscale quality selected.');
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

    await checkQuota(user, tool);

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

    const { data: job, error: jobError } = await supabase
      .from('image_jobs')
      .insert({
        user_id: user.id,
        tool_id: tool.id,
        input_asset_id: imageAsset.id,
        status: 'pending',
        params: parsedParams,
        units_cost: tool.creditsCost,
      })
      .select('*')
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Failed to create job.' }, { status: 500 });
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
