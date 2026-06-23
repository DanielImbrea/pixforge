import type { ImageJobRow, ToolDefinition } from '@/types';
import {
  getReplicateModel,
  getReplicateWebhookUrl,
  requireReplicateToken,
} from '@/lib/ai/config';
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
    return {
      image: inputAssetUrl,
      scale: params.scale === 4 ? 4 : 2,
      face_enhance: false,
    };
  }

  if (tool.category === 'background') {
    return { image: inputAssetUrl };
  }

  throw new Error(`Replicate input not defined for category ${tool.category}`);
}

export async function createReplicatePrediction(
  tool: ToolDefinition,
  job: ImageJobRow,
  inputAssetUrl: string
): Promise<{ id: string }> {
  const token = requireReplicateToken();
  const model = getReplicateModel(tool.category);
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
      if (typeof item === 'string' && item.startsWith('http')) {
        return item;
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
