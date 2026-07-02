import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runObjectRemoveInpaint } from '@/lib/ai/object-remove-inpaint';
import { objectRemoveParamsSchema } from '@/lib/validation/schemas';
import { validateUploadBuffer, ValidationError } from '@/lib/validation/upload';
import { ObjectRemoveMaskError } from '@/lib/tools/object-remove-inpaint-normalize';
import { checkRateLimit, getClientIp, maybeCleanupRateLimitStore } from '@/lib/security/rate-limit';
import { getToolById } from '@/lib/tools/registry';
import type { UserRow } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

const PREVIEW_RATE_LIMIT = 12;
const PREVIEW_RATE_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  maybeCleanupRateLimitStore();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tool = getToolById('tool_object_remove');
  if (!tool || !tool.enabled) {
    return NextResponse.json({ error: 'Tool unavailable.' }, { status: 404 });
  }

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
  if (!profile) {
    return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
  }
  const userRow = profile as UserRow;

  const rateKey = `object-remove-preview:${user.id}:${getClientIp(request)}`;
  const rate = checkRateLimit(rateKey, PREVIEW_RATE_LIMIT, PREVIEW_RATE_WINDOW_MS);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many preview requests. Try again later.' }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const maskFile = formData.get('maskFile');
    const paramsRaw = formData.get('params');

    if (!(file instanceof File) || !(maskFile instanceof File)) {
      return NextResponse.json({ error: 'Image and mask are required.' }, { status: 400 });
    }

    let params: { editMode: 'remove' | 'replace'; inpaintPrompt: string } = {
      editMode: 'remove',
      inpaintPrompt: '',
    };

    if (typeof paramsRaw === 'string') {
      const parsed = objectRemoveParamsSchema.safeParse(JSON.parse(paramsRaw));
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid object removal parameters.' }, { status: 400 });
      }
      params = {
        editMode: parsed.data.editMode,
        inpaintPrompt: parsed.data.inpaintPrompt,
      };
      if (params.editMode === 'replace' && !params.inpaintPrompt.trim()) {
        return NextResponse.json({ error: 'Replacement description is required.' }, { status: 400 });
      }
    }

    const imageBuffer = Buffer.from(await file.arrayBuffer());
    const maskBuffer = Buffer.from(await maskFile.arrayBuffer());
    await validateUploadBuffer(imageBuffer, file.type || 'image/jpeg', userRow, tool);

    const outputBuffer = await runObjectRemoveInpaint({
      imageBuffer,
      maskBuffer,
      userId: user.id,
      editMode: params.editMode,
      prompt: params.inpaintPrompt,
    });

    return new NextResponse(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    if (err instanceof ValidationError || err instanceof ObjectRemoveMaskError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Object removal preview failed.';
    console.error('[object-remove/preview]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
