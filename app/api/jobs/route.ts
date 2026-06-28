import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
 * Alternate job-creation entrypoint (input_asset_id). Not exposed in the product UI.
 */
export async function POST(_req: NextRequest) {
  return NextResponse.json({ error: 'API access is not available.' }, { status: 404 });
}
