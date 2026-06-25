import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin/auth';
import type { UserRow } from '@/types';

export async function requireAdminApi(): Promise<{ user: UserRow } | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single();
  if (!profile || !isAdminUser(profile as UserRow)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  return { user: profile as UserRow };
}
