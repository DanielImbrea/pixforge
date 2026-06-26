import type { ImageJobRow, ToolDefinition } from '@/types';
import {
  getAiProductionStatus,
  getReplicateModel,
  getReplicateWebhookUrl,
  requireReplicateToken,
} from '@/lib/ai/config';
import { normalizeReplicateModelSlug, parseModelSlug } from '@/lib/ai/replicate-models';
import type { UpscaleRouting } from '@/lib/ai/upscale-routing';
import type { BgRemovalRouting } from '@/lib/ai/bg-removal-routing';
import type { ProcessResult } from '@/lib/tools/processor';

const REPLICATE_API = 'https://api.replicate.com/v1';

export interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: unknown;
  error?: string | null;
}

function resolveModelForJob(tool: ToolDefinition, job: ImageJobRow): string {
  const params = (job.params || {}) as Record<string, unknown>;
  const upscaleRouting = params._upscaleRouting as UpscaleRouting | undefined;
  const bgRouting = params._bgRemovalRouting as BgRemovalRouting | undefined;

  if (tool.category === 'upscale' && upscaleRouting?.model) {
    return normalizeReplicateModelSlug(upscaleRouting.model);
  }
  if (tool.category === 'background' && bgRouting?.model) {
    return normalizeReplicateModelSlug(bgRouting.model);
  }
  return normalizeReplicateModelSlug(getReplicateModel(tool.category));
}

function buildReplicateInput(
  tool: ToolDefinition,
  inputAssetUrl: string,
  job: ImageJobRow,
  model: string
): Record<string, unknown> {
  const params = (job.params || {}) as Record<string, unknown>;

  if (tool.category === 'upscale') {
    const routing = params._upscaleRouting as UpscaleRouting | undefined;
    if (routing) {
      return {
        image: inputAssetUrl,
        scale: routing.scale,
        face_enhance: routing.faceEnhance,
      };
    }

    return {
      image: inputAssetUrl,
      scale: params.scale === 4 ? 4 : 2,
      face_enhance: false,
    };
  }

  if (tool.category === 'background') {
    if (model.includes('rembg') && !model.includes('background-remover')) {
      return { image: inputAssetUrl };
    }
    if (model.includes('birefnet')) {
      return { image: inputAssetUrl };
    }

    return {
      image: inputAssetUrl,
      format: 'png',
      background_type: 'rgba',
    };
  }

  throw new Error(`Replicate input not defined for category ${tool.category}`);
}

async function postReplicatePrediction(params: {
  model: string;
  input: Record<string, unknown>;
  webhook: string;
  token: string;
}): Promise<Response> {
  const parsed = parseModelSlug(params.model);
  const body = {
    input: params.input,
    webhook: params.webhook,
    webhook_events_filter: ['completed'],
  };

  if (parsed.version) {
    return fetch(`${REPLICATE_API}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...body, version: parsed.version }),
    });
  }

  return fetch(`${REPLICATE_API}/models/${parsed.owner}/${parsed.name}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function verifyReplicateModel(model: string): Promise<{
  slug: string;
  ok: boolean;
  status: number;
}> {
  const slug = normalizeReplicateModelSlug(model);
  const parsed = parseModelSlug(slug);

  try {
    const token = requireReplicateToken();
    const res = await fetch(`${REPLICATE_API}/models/${parsed.owner}/${parsed.name}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { slug, ok: res.ok, status: res.status };
  } catch {
    return { slug, ok: false, status: 0 };
  }
}

export async function createReplicatePrediction(
  tool: ToolDefinition,
  job: ImageJobRow,
  inputAssetUrl: string
): Promise<{ id: string }> {
  const token = requireReplicateToken();
  const model = resolveModelForJob(tool, job);
  const webhook = getReplicateWebhookUrl(job.id);
  const input = buildReplicateInput(tool, inputAssetUrl, job, model);
  const { issues } = getAiProductionStatus();
  if (issues.length > 0) {
    console.warn(`[replicate] config issues job=${job.id}:`, issues.join(' '));
  }

  const res = await postReplicatePrediction({ model, input, webhook, token });

  if (!res.ok) {
    const body = await res.text();
    const hint =
      res.status === 404
        ? ` Model "${model}" was not found on Replicate. Check REPLICATE_BG_* / REPLICATE_UPSCALE_* env vars — use 851-labs/background-remover (not background-removal).`
        : '';
    throw new Error(`Replicate API error (${res.status}): ${body.slice(0, 300)}.${hint}`);
  }

  const data = (await res.json()) as { id: string };
  if (!data.id) {
    throw new Error('Replicate did not return a prediction id.');
  }

  console.log(`[replicate] prediction=${data.id} job=${job.id} model=${model}`);
  return { id: data.id };
}

export async function getReplicatePrediction(predictionId: string): Promise<ReplicatePrediction> {
  const token = requireReplicateToken();
  const res = await fetch(`${REPLICATE_API}/predictions/${predictionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Replicate poll error (${res.status}): ${body.slice(0, 200)}`);
  }

  return (await res.json()) as ReplicatePrediction;
}

export function extractReplicateOutputUrl(output: unknown): string | null {
  if (typeof output === 'string' && output.startsWith('http')) {
    return output;
  }
  if (Array.isArray(output)) {
    for (const item of output) {
      const url = extractReplicateOutputUrl(item);
      if (url) return url;
    }
  }
  if (output && typeof output === 'object') {
    const record = output as Record<string, unknown>;
    for (const key of ['url', 'image', 'output', 'result']) {
      const value = record[key];
      if (typeof value === 'string' && value.startsWith('http')) {
        return value;
      }
    }
  }
  return null;
}

export async function submitReplicateJob(
  job: ImageJobRow,
  tool: ToolDefinition,
  inputAssetUrl: string
): Promise<ProcessResult> {
  try {
    const { id } = await createReplicatePrediction(tool, job, inputAssetUrl);
    return { status: 'processing', providerJobId: id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Replicate submission failed';
    return { status: 'failed', error: message };
  }
}
