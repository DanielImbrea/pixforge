import sharp from 'sharp';
import crypto from 'crypto';
import type { ImageJobRow, ToolDefinition } from '@/types';
import type { ProcessResult } from '@/lib/tools/processor';
import { getAppUrl } from '@/lib/ai/config';

async function submitToMockProvider(params: {
  jobId: string;
  inputAssetUrl: string;
  modelId: string;
  webhookPath: string;
}): Promise<{ providerJobId: string }> {
  const providerJobId = crypto.randomUUID();
  const webhookUrl = `${getAppUrl()}${params.webhookPath}?jobId=${params.jobId}`;
  const secret = process.env.AI_PROVIDER_WEBHOOK_SECRET || 'dev-secret';

  const firePayload = async () => {
    try {
      const body = JSON.stringify({
        id: providerJobId,
        status: 'succeeded',
        model: params.modelId,
        input_url: params.inputAssetUrl,
      });
      const signature = crypto.createHmac('sha256', secret).update(body).digest('base64');

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'webhook-signature': signature,
        },
        body,
      });
    } catch {
      // Best-effort mock callback; real providers retry on failure.
    }
  };

  setTimeout(() => {
    void firePayload();
  }, 3000);

  return { providerJobId };
}

export async function applyMockAiTransform(
  inputBuffer: Buffer,
  modelId: string,
  params?: Record<string, unknown>
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (modelId === 'mock-bg-removal') {
    const buffer = await sharp(inputBuffer).ensureAlpha().png().toBuffer();
    return { buffer, mimeType: 'image/png' };
  }

  const scale = params?.scale === 4 ? 4 : 2;
  const metadata = await sharp(inputBuffer).metadata();
  const targetWidth = Math.min((metadata.width || 512) * scale, 4000);
  const buffer = await sharp(inputBuffer)
    .resize({ width: targetWidth, withoutEnlargement: false })
    .sharpen()
    .jpeg({ quality: 92 })
    .toBuffer();
  return { buffer, mimeType: 'image/jpeg' };
}

export async function submitMockJob(
  job: ImageJobRow,
  tool: ToolDefinition,
  inputAssetUrl: string
): Promise<ProcessResult> {
  try {
    const modelId = tool.processorConfig.aiModelId || 'mock-default';
    const webhookPath = tool.processorConfig.aiWebhookPath || '/api/webhooks/ai-provider';

    const { providerJobId } = await submitToMockProvider({
      jobId: job.id,
      inputAssetUrl,
      modelId,
      webhookPath,
    });

    return { status: 'processing', providerJobId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown mock AI submission error';
    return { status: 'failed', error: message };
  }
}
