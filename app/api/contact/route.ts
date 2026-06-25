import { NextRequest, NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/contact/send-contact-email';
import { contactFormSchema } from '@/lib/validation/contact-schema';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message;
    return NextResponse.json({ error: firstIssue || 'validation_failed' }, { status: 400 });
  }

  if (parsed.data.website?.trim()) {
    return NextResponse.json({ ok: true });
  }

  try {
    await sendContactEmail(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'sendFailed' }, { status: 503 });
  }
}
