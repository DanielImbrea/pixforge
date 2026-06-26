import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  if (user.deleted_at) {
    return NextResponse.json({ error: 'Account already deleted.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('users')
    .update({ deleted_at: new Date().toISOString(), role: 'user' })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
