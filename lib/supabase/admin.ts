import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role client. Bypasses RLS entirely. Must NEVER be imported into
 * any file that runs in the browser bundle, and must only be used inside
 * webhook handlers and trusted server-side job processing where we have
 * already authenticated and authorized the action ourselves.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
