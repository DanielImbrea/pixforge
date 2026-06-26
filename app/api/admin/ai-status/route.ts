import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAiProductionStatus } from '@/lib/ai/config';
import {
  getBgRemovalEnvConfig,
  getResolvedBgRemovalModels,
  getResolvedUpscaleModels,
} from '@/lib/ai/replicate-models';
import { verifyReplicateModel } from '@/lib/ai/replicate-client';
import { isAdminUser } from '@/lib/admin/auth';
import type { UserRow } from '@/types';

export const runtime = 'nodejs';

/** Admin-only: verify Replicate / AI env configuration on production. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
  if (!profile || !isAdminUser(profile as UserRow)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const status = getAiProductionStatus();
  const bgModels = getResolvedBgRemovalModels();
  const upscaleModels = getResolvedUpscaleModels();
  const bgEnv = getBgRemovalEnvConfig();

  const uniqueModels = [...new Set([...Object.values(bgModels), ...Object.values(upscaleModels)])];
  const modelChecks =
    status.provider === 'replicate' && status.replicateTokenConfigured
      ? await Promise.all(
          uniqueModels.map(async (model) => {
            const check = await verifyReplicateModel(model);
            return {
              model: check.slug,
              version: check.version,
              ok: check.ok,
              status: check.status,
            };
          })
        )
      : [];

  return NextResponse.json({
    ...status,
    models: { background: bgModels, upscale: upscaleModels },
    backgroundEnv: bgEnv.envSources,
    backgroundVersionOverride: bgEnv.versionOverride ?? null,
    modelChecks,
  });
}
