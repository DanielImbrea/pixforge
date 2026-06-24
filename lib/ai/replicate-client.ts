import type { ImageJobRow, ToolDefinition } from '@/types';
import {
  getReplicateModel,
  getReplicateWebhookUrl,
  requireReplicateToken,
} from '@/lib/ai/config';
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

function parseModelSlug(model: string): { owner: string; name: string } {
  const [owner, name] = model.split('/');
  if (!owner || !name) {
    throw new Error(`Invalid Replicate model slug "${model}". Expected owner/name.`);
  }
  return { owner, name };
}

function buildReplicateInput(
  tool: ToolDefinition,
  inputAssetUrl: string,
  job: ImageJobRow
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
    const routing = params._bgRemovalRouting as BgRemovalRouting | undefined;
    const model = routing?.model || getReplicateModel(tool.category);

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

export async function createReplicatePrediction(
  tool: ToolDefinition,
  job: ImageJobRow,
  inputAssetUrl: string
): Promise<{ id: string }> {
  const token = requireReplicateToken();
  const params = (job.params || {}) as Record<string, unknown>;
  const upscaleRouting = params._upscaleRouting as UpscaleRouting | undefined;
  const bgRouting = params._bgRemovalRouting as BgRemovalRouting | undefined;
  const model =
    tool.category === 'upscale' && upscaleRouting?.model
      ? upscaleRouting.model
      : tool.category === 'background' && bgRouting?.model
        ? bgRouting.model
        : getReplicateModel(tool.category);
  const { owner, name } = parseModelSlug(model);
  const webhook = getReplicateWebhookUrl(job.id);

  const res = await fetch(`${REPLICATE_API}/models/${owner}/${name}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: buildReplicateInput(tool, inputAssetUrl, job),
      webhook,
      webhook_events_filter: ['completed'],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Replicate API error (${res.status}): ${body.slice(0, 300)}`);
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
