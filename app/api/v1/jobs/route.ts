import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api/authenticate-api-key';
import { createAdminClient } from '@/lib/supabase/admin';
import { getToolById } from '@/lib/tools/registry';
import { checkQuota, QuotaExceededError, PlanRestrictedError } from '@/lib/billing/entitlements';
import { checkRateLimit, maybeCleanupRateLimitStore } from '@/lib/security/rate-limit';
import { jobCreateRequestSchema } from '@/lib/validation/schemas';
import type { UserRow } from '@/types';

export const runtime = 'nodejs';

/**
 * Pro API: list jobs or create a job from an existing input asset.
 * Auth: Bearer pf_live_...
 */
export async function GET(req: NextRequest) {
  maybeCleanupRateLimitStore();
  const auth = await authenticateApiKey(req.headers.get('authorization'));
  if (!auth) {
    return NextResponse.json({ error: 'Invalid or missing API key.' }, { status: 401 });
  }

  const limit = Math.min(Number(new URL(req.url).searchParams.get('limit') || '50'), 100);
  const admin = createAdminClient();
  const { data: jobs } = await admin
    .from('image_jobs')
    .select('id, tool_id, status, created_at, completed_at, error_message')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  return NextResponse.json({ jobs: jobs || [] });
}

export async function POST(req: NextRequest) {
  maybeCleanupRateLimitStore();
  const auth = await authenticateApiKey(req.headers.get('authorization'));
  if (!auth) {
    return NextResponse.json({ error: 'Invalid or missing API key.' }, { status: 401 });
  }

  const rate = checkRateLimit(`api:user:${auth.user.id}`, 60, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = jobCreateRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.', details: parsed.error.flatten() }, { status: 400 });
  }

  const { toolId, inputAssetId, params: jobParams } = parsed.data;
  const tool = getToolById(toolId);
  if (!tool || !tool.enabled) {
    return NextResponse.json({ error: 'Unknown tool.' }, { status: 404 });
  }

  const user = auth.user as UserRow;

  try {
    await checkQuota(user, tool);
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return NextResponse.json(
        { error: `Not enough credits. Need ${err.needed}, ${err.remaining} remaining.` },
        { status: 402 }
      );
    }
    if (err instanceof PlanRestrictedError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }

  const admin = createAdminClient();
  const { data: inputAsset } = await admin
    .from('image_assets')
    .select('*')
    .eq('id', inputAssetId)
    .eq('user_id', user.id)
    .single();

  if (!inputAsset) {
    return NextResponse.json({ error: 'Input asset not found.' }, { status: 404 });
  }

  const { data: job, error } = await admin
    .from('image_jobs')
    .insert({
      user_id: user.id,
      tool_id: tool.id,
      input_asset_id: inputAsset.id,
      status: 'pending',
      params: jobParams,
      units_cost: tool.creditsCost,
    })
    .select('id, status, tool_id, created_at')
    .single();

  if (error || !job) {
    return NextResponse.json({ error: 'Failed to create job.' }, { status: 500 });
  }

  return NextResponse.json(
    {
      job,
      nextStep: `POST /api/jobs/${job.id}/process with the same Authorization header.`,
    },
    { status: 201 }
  );
}
