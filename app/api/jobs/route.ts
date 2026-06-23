import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getToolById } from '@/lib/tools/registry';
import { checkQuota, QuotaExceededError, PlanRestrictedError } from '@/lib/billing/entitlements';
import { planHasFeature } from '@/lib/billing/plan-features';
import { jobCreateRequestSchema } from '@/lib/validation/schemas';
import type { UserRow } from '@/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get('limit') || '50');
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 50;

  const { data: jobs, error } = await supabase
    .from('image_jobs')
    .select('*')
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: 'Failed to list jobs.' }, { status: 500 });
  }

  return NextResponse.json({ jobs: jobs || [] });
}

/**
 * Alternate job-creation entrypoint that takes an already-uploaded
 * input_asset_id rather than a raw file. This is the path the Pro-tier API
 * access feature (spec Section: PRO plan -> API access) would call once a
 * client has uploaded an asset through a separate signed-upload flow. The
 * primary UI flow still goes through /api/upload, which creates the job and
 * the input asset together in one request.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
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

  const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single();
  if (!profile) {
    return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
  }
  const user = profile as UserRow;

  if (!planHasFeature(user.plan, 'apiAccess')) {
    return NextResponse.json({ error: 'API access requires the Pro plan.' }, { status: 403 });
  }

  try {
    await checkQuota(user, tool);
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return NextResponse.json({ error: 'You have reached your plan quota.' }, { status: 402 });
    }
    if (err instanceof PlanRestrictedError) {
      return NextResponse.json({ error: 'This tool is not available on your plan.' }, { status: 403 });
    }
    throw err;
  }

  const { data: inputAsset } = await supabase
    .from('image_assets')
    .select('*')
    .eq('id', inputAssetId)
    .eq('user_id', authUser.id)
    .single();

  if (!inputAsset) {
    return NextResponse.json({ error: 'Input asset not found.' }, { status: 404 });
  }

  const { data: job, error: jobError } = await supabase
    .from('image_jobs')
    .insert({
      user_id: authUser.id,
      tool_id: tool.id,
      input_asset_id: inputAsset.id,
      status: 'pending',
      params: jobParams,
      units_cost: tool.creditsCost,
    })
    .select('*')
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: 'Failed to create job.' }, { status: 500 });
  }

  return NextResponse.json({ job }, { status: 201 });
}
