import { NextRequest, NextResponse } from 'next/server';
import { getAiProvider } from '@/lib/ai/config';
import { handleReplicatePrediction } from '@/lib/ai/complete-ai-job';
import type { ReplicatePrediction } from '@/lib/ai/replicate-client';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Replicate calls this URL when a prediction completes (webhook_events_filter: completed).
 * Set APP_URL to your public production domain so Replicate can reach this endpoint.
 */
export async function POST(req: NextRequest) {
  if (getAiProvider() !== 'replicate') {
    return NextResponse.json({ error: 'Replicate webhooks disabled (AI_PROVIDER is not replicate).' }, { status: 503 });
  }

  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId query parameter.' }, { status: 400 });
  }

  let prediction: ReplicatePrediction;
  try {
    prediction = (await req.json()) as ReplicatePrediction;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!prediction?.id || !prediction?.status) {
    return NextResponse.json({ error: 'Invalid Replicate prediction payload.' }, { status: 400 });
  }

  try {
    await handleReplicatePrediction(jobId, prediction);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to process Replicate webhook.';
    console.error(`[replicate webhook] job=${jobId}`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
