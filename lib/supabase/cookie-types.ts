import type { CookieOptions } from '@supabase/ssr';

export type SupabaseCookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export type SupabaseCookiesToSet = SupabaseCookieToSet[];
