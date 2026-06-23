import type { ToolCategory } from '@/types';

export type AiProviderMode = 'mock' | 'replicate';

export function getAiProvider(): AiProviderMode {
  return process.env.AI_PROVIDER === 'replicate' ? 'replicate' : 'mock';
}

export function requireReplicateToken(): string {
  const token = process.env.REPLICATE_API_TOKEN?.trim();
  if (!token) {
    throw new Error(
      'REPLICATE_API_TOKEN is required when AI_PROVIDER=replicate. Get one at https://replicate.com/account/api-tokens'
    );
  }
  return token;
}

export function getReplicateModel(category: ToolCategory): string {
  if (category === 'upscale') {
    return process.env.REPLICATE_UPSCALE_MODEL?.trim() || 'nightmareai/real-esrgan';
  }
  if (category === 'background') {
    return process.env.REPLICATE_BG_REMOVAL_MODEL?.trim() || '851-labs/background-remover';
  }
  throw new Error(`No Replicate model configured for tool category: ${category}`);
}

export function getAppUrl(): string {
  return process.env.APP_URL?.replace(/\/$/, '') || 'http://localhost:3001';
}

export function getReplicateWebhookUrl(jobId: string): string {
  return `${getAppUrl()}/api/webhooks/replicate?jobId=${encodeURIComponent(jobId)}`;
}
