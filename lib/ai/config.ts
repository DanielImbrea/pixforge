import type { ToolCategory } from '@/types';
import { getResolvedBgRemovalModels } from '@/lib/ai/replicate-models';

export type AiProviderMode = 'mock' | 'replicate';

export interface AiProductionStatus {
  provider: AiProviderMode;
  appUrl: string;
  webhookBaseUrl: string;
  replicateTokenConfigured: boolean;
  ready: boolean;
  issues: string[];
}

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
    return getResolvedBgRemovalModels().default;
  }
  if (category === 'faces') {
    return 'browser-face-blur';
  }
  throw new Error(`No Replicate model configured for tool category: ${category}`);
}

/** Public base URL for webhooks and callbacks — must be reachable by Replicate. */
export function getAppUrl(): string {
  const explicit = process.env.APP_URL?.replace(/\/$/, '');
  if (explicit) return explicit;

  const publicUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (publicUrl && !publicUrl.includes('localhost')) return publicUrl;

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3001';
}

export function getReplicateWebhookUrl(jobId: string): string {
  return `${getAppUrl()}/api/webhooks/replicate?jobId=${encodeURIComponent(jobId)}`;
}

/** Signed URL lifetime for images sent to Replicate (must stay valid until fetch). */
export function getReplicateInputUrlTtlSeconds(): number {
  const raw = Number(process.env.REPLICATE_INPUT_URL_TTL_SECONDS);
  if (Number.isFinite(raw) && raw >= 600 && raw <= 86_400) return raw;
  return 3600;
}

export function getAiProductionStatus(): AiProductionStatus {
  const provider = getAiProvider();
  const appUrl = getAppUrl();
  const replicateTokenConfigured = Boolean(process.env.REPLICATE_API_TOKEN?.trim());
  const issues: string[] = [];

  if (provider === 'replicate') {
    if (!replicateTokenConfigured) {
      issues.push('Set REPLICATE_API_TOKEN in environment variables.');
    }
    if (appUrl.includes('localhost') || appUrl.startsWith('http://')) {
      issues.push(
        'Set APP_URL=https://www.pixiqueai.com so Replicate webhooks reach your production site.'
      );
    }
  }

  return {
    provider,
    appUrl,
    webhookBaseUrl: `${appUrl}/api/webhooks/replicate`,
    replicateTokenConfigured,
    ready: provider === 'mock' || (replicateTokenConfigured && issues.length === 0),
    issues,
  };
}
