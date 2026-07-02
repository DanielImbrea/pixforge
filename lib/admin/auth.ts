import { redirect } from 'next/navigation';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { UserRow } from '@/types';

function adminEmailsFromEnv(): string[] {
  const raw = process.env.ADMIN_EMAIL?.trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmailFallback(email: string): boolean {
  const allowed = adminEmailsFromEnv();
  return allowed.length > 0 && allowed.includes(email.toLowerCase());
}

export function isAdminUser(user: Pick<UserRow, 'email' | 'role' | 'deleted_at'>): boolean {
  if (user.deleted_at) return false;
  if (user.role === 'admin') return true;
  return isAdminEmailFallback(user.email);
}

async function loadAuthoritativeProfile(userId: string): Promise<UserRow | null> {
  const admin = createAdminClient();
  const { data: profile } = await admin.from('users').select('*').eq('id', userId).maybeSingle();
  if (!profile || (profile as UserRow).deleted_at) return null;
  return profile as UserRow;
}

export async function requireAdminUser(locale: string): Promise<UserRow> {
  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      redirect(`/${locale}/auth/login?redirectTo=${encodeURIComponent(`/${locale}/admin`)}`);
    }

    const profile = await loadAuthoritativeProfile(authUser.id);
    if (!profile || !isAdminUser(profile)) {
      redirect(`/${locale}/dashboard`);
    }
    return profile;
  }

  const profile = await loadAuthoritativeProfile(sessionUser.id);
  if (!profile || !isAdminUser(profile)) {
    redirect(`/${locale}/dashboard`);
  }

  return profile;
}

export async function getAdminSession(): Promise<UserRow | null> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return null;

  const profile = await loadAuthoritativeProfile(sessionUser.id);
  if (!profile || !isAdminUser(profile)) return null;
  return profile;
}
