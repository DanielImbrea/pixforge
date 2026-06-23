import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyMockAiTransform } from '@/lib/ai/mock-provider';
import { fetchAsBuffer } from '@/lib/ai/fetch-image';
import { completeAiJobFromOutputBuffer, failAiJob } from '@/lib/ai/complete-ai-job';
import { getAiProvider } from '@/lib/ai/config';
import type { ImageJobRow } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** Mock AI webhook — used when AI_PROVIDER=mock (local dev). */
export async function POST(req: NextRequest) {
  if (getAiProvider() !== 'mock') {
    return NextResponse.json({ error: 'Mock webhook disabled in production mode.' }, { status: 503 });
  }

  const body = await req.text();
  const signature = req.headers.get('webhook-signature');
  const secret = process.env.AI_PROVIDER_WEBHOOK_SECRET || 'dev-secret';

  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 401 });
  }

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId.' }, { status: 400 });
  }

  const payload = JSON.parse(body) as {
    id: string;
    status: 'succeeded' | 'failed';
    model: string;
    input_url: string;
    error?: string;
  };

  const admin = createAdminClient();

  const { data: job } = await admin.from('image_jobs').select('*').eq('id', jobId).single();
  if (!job) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  }
  const jobRow = job as ImageJobRow;

  if (jobRow.status === 'done' || jobRow.status === 'failed') {
    return NextResponse.json({ received: true, alreadyProcessed: true });
  }

  if (payload.status === 'failed') {
    await failAiJob(jobId, payload.error || 'Provider processing failed.');
    return NextResponse.json({ received: true });
  }

  try {
    await admin.from('image_jobs').update({ provider_job_id: payload.id }).eq('id', jobRow.id);

    const inputBuffer = await fetchAsBuffer(payload.input_url);
    const { buffer: outputBuffer, mimeType } = await applyMockAiTransform(
      inputBuffer,
      payload.model,
      (jobRow.params || {}) as Record<string, unknown>
    );

    await completeAiJobFromOutputBuffer(jobId, outputBuffer, mimeType);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to finalize AI job.';
    await failAiJob(jobId, message);
  }

  return NextResponse.json({ received: true });
}
