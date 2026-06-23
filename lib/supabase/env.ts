const INVALID_SUPABASE_URL_HINT = 'Use https://xxx.supabase.co without /rest/v1/';

export function getSupabasePublicEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  if (url.includes('/rest/v1')) {
    console.error(`[supabase] Invalid NEXT_PUBLIC_SUPABASE_URL: ${INVALID_SUPABASE_URL_HINT}`);
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co')) {
      console.error(`[supabase] Invalid NEXT_PUBLIC_SUPABASE_URL host: ${parsed.hostname}`);
      return null;
    }
  } catch {
    console.error('[supabase] NEXT_PUBLIC_SUPABASE_URL is not a valid URL.');
    return null;
  }

  return { url, anonKey };
}

export function requireSupabasePublicEnv(): { url: string; anonKey: string } {
  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  return env;
}
