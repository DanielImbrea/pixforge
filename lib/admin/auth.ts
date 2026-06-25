import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import type { UserRow } from '@/types';

export function isAdminEmailFallback(email: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  return Boolean(adminEmail && email.toLowerCase() === adminEmail.toLowerCase());
}

export function isAdminUser(user: Pick<UserRow, 'email' | 'role' | 'deleted_at'>): boolean {
  if (user.deleted_at) return false;
  if (user.role === 'admin') return true;
  return isAdminEmailFallback(user.email);
}

export async function requireAdminUser(locale: string): Promise<UserRow> {
  const user = await getCurrentUser();
  if (!user || !isAdminUser(user)) {
    redirect(`/${locale}/dashboard`);
  }
  return user;
}

export async function getAdminSession(): Promise<UserRow | null> {
  const user = await getCurrentUser();
  if (!user || !isAdminUser(user)) return null;
  return user;
}
