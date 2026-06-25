import { cache } from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { UserRow } from '@/types';
import { getSupabasePublicEnv, requireSupabasePublicEnv } from '@/lib/supabase/env';
import type { SupabaseCookiesToSet } from '@/lib/supabase/cookie-types';

function createServerClientFromCookies() {
  const cookieStore = cookies();
  return cookieStore.then((store) => {
    const { url, anonKey } = requireSupabasePublicEnv();
    return createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(cookiesToSet: SupabaseCookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              store.set(name, value, options);
            });
          } catch {
            // Server Component without write access — middleware refreshes session.
          }
        },
      },
    });
  });
}

export async function createClient() {
  return createServerClientFromCookies();
}

export const getCurrentUser = cache(async (): Promise<UserRow | null> => {
  const env = getSupabasePublicEnv();
  if (!env) {
    return null;
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Read-only in this code path; middleware handles session refresh.
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    const row = profile as UserRow;
    if (row.deleted_at) {
      return null;
    }

    return row;
  } catch (error) {
    console.error('[getCurrentUser] failed:', error);
    return null;
  }
});
