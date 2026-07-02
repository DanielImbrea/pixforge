import sharp from 'sharp';
import crypto from 'crypto';
import type { ImageJobRow, ToolDefinition } from '@/types';
import type { ProcessResult } from '@/lib/tools/processor';
import { fetchAsBuffer } from '@/lib/ai/fetch-image';
import { applyMockObjectRemove } from '@/lib/ai/object-remove-inpaint';
import { applyMockPortraitEnhance } from '@/lib/ai/portrait-enhance-process';
import type { PortraitEnhanceRouting } from '@/lib/ai/portrait-enhance-routing';
import { getAppUrl } from '@/lib/ai/config';

function resolveMockModelId(tool: ToolDefinition): string {
  if (tool.category === 'background' || tool.category === 'background_replace') return 'mock-bg-removal';
  if (tool.category === 'object_remove') return 'mock-object-remove';
  if (tool.category === 'portrait_enhance') return 'mock-portrait-enhance';
  if (tool.category === 'upscale') return 'mock-upscale';
  if (tool.category === 'faces') return 'mock-blur-faces';
  return tool.processorConfig.aiModelId || 'mock-default';
}

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
  if (modelId === 'mock-bg-removal' || modelId.includes('background')) {
    const buffer = await sharp(inputBuffer).ensureAlpha().png().toBuffer();
    return { buffer, mimeType: 'image/png' };
  }

  if (modelId === 'mock-blur-faces' || modelId.includes('blur-faces')) {
    const routing = params?._blurFacesRouting as { blurRadius?: number } | undefined;
    const sigma = Math.max(3, Math.min(20, (routing?.blurRadius ?? 15) / 2));
    const meta = await sharp(inputBuffer).rotate().metadata();
    const width = meta.width ?? 512;
    const height = meta.height ?? 512;
    const faceWidth = Math.round(width * 0.22);
    const faceHeight = Math.round(height * 0.28);
    const left = Math.round(width * 0.39);
    const top = Math.round(height * 0.28);
    const blurredFace = await sharp(inputBuffer)
      .rotate()
      .extract({ left, top, width: faceWidth, height: faceHeight })
      .blur(sigma)
      .toBuffer();
    const buffer = await sharp(inputBuffer)
      .rotate()
      .composite([{ input: blurredFace, left, top }])
      .toBuffer();
    const mimeType =
      meta.format === 'png'
        ? 'image/png'
        : meta.format === 'webp'
          ? 'image/webp'
          : 'image/jpeg';
    return { buffer, mimeType };
  }

  const scale =
    (params?._upscaleRouting as { scale?: number } | undefined)?.scale ??
    (params?.scale === 4 ? 4 : 2);
  const metadata = await sharp(inputBuffer).metadata();
  const targetWidth = Math.min((metadata.width || 512) * scale, 4000);
  const buffer = await sharp(inputBuffer)
    .resize({ width: targetWidth, withoutEnlargement: false })
    .sharpen()
    .jpeg({ quality: 92 })
    .toBuffer();
  return { buffer, mimeType: 'image/jpeg' };
}

/**
 * Mock AI runs synchronously so jobs complete on Vercel/serverless.
 * setTimeout webhooks do not survive after the HTTP response ends.
 */
export async function submitMockJob(
  job: ImageJobRow,
  tool: ToolDefinition,
  inputAssetUrl: string
): Promise<ProcessResult> {
  try {
    if (tool.category === 'object_remove') {
      const maskUrl = (job.params as Record<string, unknown> | undefined)?._maskAssetUrl as
        | string
        | undefined;
      if (!maskUrl) {
        return { status: 'failed', error: 'Mask is required for object removal.' };
      }
      const [inputBuffer, maskBuffer] = await Promise.all([
        fetchAsBuffer(inputAssetUrl),
        fetchAsBuffer(maskUrl),
      ]);
      const outputBuffer = await applyMockObjectRemove(inputBuffer, maskBuffer);
      return { status: 'done', outputBuffer, outputMimeType: 'image/jpeg' };
    }

    if (tool.category === 'portrait_enhance') {
      const routing = (job.params as Record<string, unknown> | undefined)?._portraitEnhanceRouting as
        | PortraitEnhanceRouting
        | undefined;
      const inputBuffer = await fetchAsBuffer(inputAssetUrl);
      const outputBuffer = await applyMockPortraitEnhance(inputBuffer, {
        mode: routing?.mode,
        preset: routing?.preset,
        intensity: routing?.intensity,
        enhanceStyle: routing?.enhanceStyle,
      });
      const meta = await (await import('sharp')).default(inputBuffer).rotate().metadata();
      const mimeType =
        meta.format === 'png'
          ? 'image/png'
          : meta.format === 'webp'
            ? 'image/webp'
            : 'image/jpeg';
      return { status: 'done', outputBuffer, outputMimeType: mimeType };
    }

    const modelId = resolveMockModelId(tool);
    const inputBuffer = await fetchAsBuffer(inputAssetUrl);
    const { buffer, mimeType } = await applyMockAiTransform(
      inputBuffer,
      modelId,
      (job.params || {}) as Record<string, unknown>
    );

    return { status: 'done', outputBuffer: buffer, outputMimeType: mimeType };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown mock AI submission error';
    return { status: 'failed', error: message };
  }
}

/** Legacy async mock path for local webhook testing only. */
export async function submitMockJobAsync(
  job: ImageJobRow,
  tool: ToolDefinition,
  inputAssetUrl: string
): Promise<ProcessResult> {
  try {
    const modelId = resolveMockModelId(tool);
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
