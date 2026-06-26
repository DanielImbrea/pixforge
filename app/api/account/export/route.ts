import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPeriodStartForPlan } from '@/lib/billing/plans';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const admin = createAdminClient();
  const periodStart = getPeriodStartForPlan(user.plan);

  const [{ data: jobs }, { data: usage }, { data: assets }, { data: subscription }] = await Promise.all([
    admin
      .from('image_jobs')
      .select('id, tool_id, status, credits_charged, created_at, completed_at, error_message')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500),
    admin
      .from('tool_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('period_start', periodStart)
      .maybeSingle(),
    admin.from('image_assets').select('id, asset_type, created_at').eq('user_id', user.id).limit(500),
    admin
      .from('subscriptions')
      .select('status, current_period_end, stripe_subscription_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    account: {
      email: user.email,
      plan: user.plan,
      locale: user.locale,
      createdAt: user.created_at,
    },
    subscription: subscription ?? null,
    usage: usage ?? null,
    jobs: jobs ?? [],
    assets: assets ?? [],
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="pixiqueai-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
