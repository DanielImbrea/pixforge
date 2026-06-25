import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAiProductionStatus } from '@/lib/ai/config';

export const runtime = 'nodejs';

/** Admin-only: verify Replicate / AI env configuration on production. */
export async function GET() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) {
    return NextResponse.json({ error: 'ADMIN_EMAIL is not configured.' }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || user.email !== adminEmail) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const status = getAiProductionStatus();
  return NextResponse.json(status);
}
