import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import type { UserRow } from '@/types';

/** Re-enable when public API is offered in product UI and pricing. */
const API_ACCESS_ENABLED = false;

export interface ApiAuthResult {
  user: UserRow;
  apiKeyId: string;
}

function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export function generateApiKeyMaterial(): { rawKey: string; prefix: string; hash: string } {
  const secret = crypto.randomBytes(24).toString('hex');
  const rawKey = `pf_live_${secret}`;
  const prefix = rawKey.slice(0, 16);
  return { rawKey, prefix, hash: hashApiKey(rawKey) };
}

export async function authenticateApiKey(
  authorizationHeader: string | null
): Promise<ApiAuthResult | null> {
  if (!API_ACCESS_ENABLED) return null;

  if (!authorizationHeader?.startsWith('Bearer ')) return null;

  const rawKey = authorizationHeader.slice('Bearer '.length).trim();
  if (!rawKey.startsWith('pf_live_') || rawKey.length < 20) return null;

  const hash = hashApiKey(rawKey);
  const admin = createAdminClient();

  const { data: keyRow } = await admin
    .from('api_keys')
    .select('id, user_id')
    .eq('key_hash', hash)
    .is('revoked_at', null)
    .maybeSingle();

  if (!keyRow) return null;

  const { data: user } = await admin.from('users').select('*').eq('id', keyRow.user_id).single();
  if (!user) return null;

  const profile = user as UserRow;

  await admin
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRow.id);

  return { user: profile, apiKeyId: keyRow.id };
}

export { hashApiKey };
