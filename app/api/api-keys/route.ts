import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateApiKeyMaterial } from '@/lib/api/authenticate-api-key';
import { planHasFeature } from '@/lib/billing/plan-features';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  if (!planHasFeature(user.plan, 'apiAccess')) {
    return NextResponse.json({ error: 'API access requires the Pro plan.' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: keys } = await admin
    .from('api_keys')
    .select('id, name, key_prefix, last_used_at, created_at, revoked_at')
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });

  return NextResponse.json({ keys: keys || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const user = await getCurrentUser();
  if (!user || !planHasFeature(user.plan, 'apiAccess')) {
    return NextResponse.json({ error: 'API access requires the Pro plan.' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 64) : 'Default';

  const admin = createAdminClient();
  const { count } = await admin
    .from('api_keys')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('revoked_at', null);

  if ((count || 0) >= 5) {
    return NextResponse.json({ error: 'Maximum of 5 active API keys allowed.' }, { status: 400 });
  }

  const { rawKey, prefix, hash } = generateApiKeyMaterial();

  const { data: keyRow, error } = await admin
    .from('api_keys')
    .insert({
      user_id: user.id,
      name,
      key_prefix: prefix,
      key_hash: hash,
    })
    .select('id, name, key_prefix, created_at')
    .single();

  if (error || !keyRow) {
    return NextResponse.json({ error: 'Failed to create API key.' }, { status: 500 });
  }

  return NextResponse.json({
    key: rawKey,
    apiKey: keyRow,
    message: 'Store this key securely — it will not be shown again.',
  });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const keyId = searchParams.get('id');
  if (!keyId) {
    return NextResponse.json({ error: 'Missing key id.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to revoke key.' }, { status: 500 });
  }

  return NextResponse.json({ revoked: true });
}
