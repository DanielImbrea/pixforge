import type { ImageJobRow, ToolDefinition } from '@/types';
import {
  getAiProductionStatus,
  getReplicateModel,
  getReplicateWebhookUrl,
  requireReplicateToken,
} from '@/lib/ai/config';
import { mapReplicateError } from '@/lib/ai/replicate-errors';
import {
  normalizeReplicateModelSlug,
  parseModelSlug,
  formatReplicateVersion,
  getPinnedReplicateVersion,
  getBgRemovalVersionFromEnv,
} from '@/lib/ai/replicate-models';
import type { UpscaleRouting } from '@/lib/ai/upscale-routing';
import type { BgRemovalRouting } from '@/lib/ai/bg-removal-routing';
import { resolveBlurFacesPinnedVersion } from '@/lib/ai/blur-faces-config';
import type { PortraitEnhanceRouting } from '@/lib/ai/portrait-enhance-routing';
import type { BlurFacesRouting } from '@/lib/ai/blur-faces-routing';
import { resolveObjectRemoveInpaintPrompt } from '@/lib/tools/object-remove-params';
import type { ProcessResult } from '@/lib/tools/processor';

const REPLICATE_API = 'https://api.replicate.com/v1';

/** Replicate allows Prefer: wait between 1 and 60 seconds (inclusive). */
export const REPLICATE_SYNC_WAIT_MAX_SECONDS = 60;

const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_POLL_TIMEOUT_MS = 90_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runReplicatePredictionAndWait(params: {
  versionId: string;
  input: Record<string, unknown>;
  token?: string;
  waitSeconds?: number;
  pollTimeoutMs?: number;
  pollIntervalMs?: number;
}): Promise<ReplicatePrediction> {
  const token = params.token ?? requireReplicateToken();
  const waitSeconds = Math.min(
    REPLICATE_SYNC_WAIT_MAX_SECONDS,
    Math.max(1, params.waitSeconds ?? REPLICATE_SYNC_WAIT_MAX_SECONDS)
  );

  const res = await fetch(`${REPLICATE_API}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: `wait=${waitSeconds}`,
    },
    body: JSON.stringify({
      version: params.versionId,
      input: params.input,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw Object.assign(new Error(`Replicate API ${res.status}: ${body.slice(0, 200)}`), {
      httpStatus: res.status,
      apiBody: body,
    });
  }

  let prediction = (await res.json()) as ReplicatePrediction;
  const deadline = Date.now() + (params.pollTimeoutMs ?? DEFAULT_POLL_TIMEOUT_MS);
  const pollInterval = params.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

  while (prediction.status === 'starting' || prediction.status === 'processing') {
    if (Date.now() >= deadline) {
      throw new Error('Replicate prediction timed out before completion.');
    }
    await sleep(pollInterval);
    prediction = await getReplicatePrediction(prediction.id);
  }

  return prediction;
}

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
  const blurRouting = params._blurFacesRouting as BlurFacesRouting | undefined;

  const portraitRouting = params._portraitEnhanceRouting as PortraitEnhanceRouting | undefined;

  if (tool.category === 'upscale' && upscaleRouting?.model) {
    return normalizeReplicateModelSlug(upscaleRouting.model);
  }
  if (tool.category === 'background' || tool.category === 'background_replace') {
    if (bgRouting?.model) {
      return normalizeReplicateModelSlug(bgRouting.model);
    }
  }
  if (tool.category === 'faces' && blurRouting?.model) {
    return normalizeReplicateModelSlug(blurRouting.model);
  }
  if (tool.category === 'portrait_enhance' && portraitRouting?.model) {
    return normalizeReplicateModelSlug(portraitRouting.model);
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

  if (tool.category === 'background' || tool.category === 'background_replace') {
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

  if (tool.category === 'faces') {
    const routing = params._blurFacesRouting as BlurFacesRouting | undefined;
    const input: Record<string, unknown> = {
      image: inputAssetUrl,
      blur: routing?.blurRadius ?? 15,
    };
    const referenceUrl = params._referenceAssetUrl as string | undefined;
    if (routing?.detectionMode === 'custom' && referenceUrl) {
      input.reference_image = referenceUrl;
      input.reference = referenceUrl;
      input.portrait = referenceUrl;
      input.action = routing.customAction;
      input.mode = routing.customAction;
    }
    return input;
  }

  if (tool.category === 'object_remove') {
    const maskUrl = params._maskAssetUrl as string | undefined;
    if (!maskUrl) {
      throw new Error('Mask URL is required for object removal.');
    }
    const editMode =
      params.editMode === 'replace' ? 'replace' : ('remove' as const);
    const prompt = resolveObjectRemoveInpaintPrompt(
      editMode,
      typeof params.inpaintPrompt === 'string' ? params.inpaintPrompt : ''
    );
    return {
      image: inputAssetUrl,
      mask: maskUrl,
      prompt,
      output_format: 'jpg',
    };
  }

  if (tool.category === 'portrait_enhance') {
    const routing = params._portraitEnhanceRouting as PortraitEnhanceRouting | undefined;
    if (model.includes('codeformer')) {
      return {
        image: inputAssetUrl,
        codeformer_fidelity: routing?.codeformerFidelity ?? 0.55,
        background_enhance: routing?.backgroundEnhance ?? true,
        face_upsample: routing?.faceUpsample ?? true,
        upscale: 1,
      };
    }
    if (model.includes('gfpgan')) {
      return {
        img: inputAssetUrl,
        scale: 2,
        version: 'v1.4',
      };
    }
    return {
      image: inputAssetUrl,
      codeformer_fidelity: routing?.codeformerFidelity ?? 0.55,
      background_enhance: routing?.backgroundEnhance ?? true,
      face_upsample: routing?.faceUpsample ?? true,
      upscale: 1,
    };
  }

  throw new Error(`Replicate input not defined for category ${tool.category}`);
}

export async function resolveReplicateVersion(
  model: string,
  token: string,
  options: { toolCategory?: string } = {}
): Promise<string> {
  const parsed = parseModelSlug(model);

  if (parsed.version) {
    return formatReplicateVersion(parsed.slug, parsed.version);
  }

  if (options.toolCategory === 'background' || options.toolCategory === 'background_replace') {
    const envVersion = getBgRemovalVersionFromEnv();
    if (envVersion) {
      return formatReplicateVersion(parsed.slug, envVersion);
    }
  }

  if (options.toolCategory === 'faces') {
    const pinned = resolveBlurFacesPinnedVersion(parsed.slug, false);
    if (pinned) {
      return formatReplicateVersion(parsed.slug, pinned);
    }
  }

  const pinned = getPinnedReplicateVersion(parsed.slug);
  if (pinned) {
    return formatReplicateVersion(parsed.slug, pinned);
  }

  const res = await fetch(`${REPLICATE_API}/models/${parsed.owner}/${parsed.name}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw Object.assign(new Error(`Model lookup failed (${res.status})`), {
      httpStatus: res.status,
      apiBody: body,
      model: parsed.slug,
    });
  }

  const data = (await res.json()) as { latest_version?: { id?: string } | null };
  const versionId = data.latest_version?.id;
  if (!versionId) {
    throw Object.assign(new Error(`Model "${parsed.slug}" has no published version.`), {
      httpStatus: 404,
      model: parsed.slug,
    });
  }

  return formatReplicateVersion(parsed.slug, versionId);
}

async function postReplicatePrediction(params: {
  model: string;
  toolCategory: string;
  input: Record<string, unknown>;
  webhook: string;
  token: string;
}): Promise<{ response: Response; version: string }> {
  const version = await resolveReplicateVersion(params.model, params.token, {
    toolCategory: params.toolCategory,
  });

  const response = await fetch(`${REPLICATE_API}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version,
      input: params.input,
      webhook: params.webhook,
      webhook_events_filter: ['completed'],
    }),
  });

  return { response, version };
}

export async function verifyReplicateModel(model: string): Promise<{
  slug: string;
  version: string | null;
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

    let version: string | null = null;
    if (res.ok) {
      try {
        version = await resolveReplicateVersion(slug, token);
      } catch {
        version = getPinnedReplicateVersion(slug) ?? null;
      }
    }

    return { slug, version, ok: res.ok, status: res.status };
  } catch {
    return { slug, version: getPinnedReplicateVersion(slug) ?? null, ok: false, status: 0 };
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

  const { response: res, version } = await postReplicatePrediction({
    model,
    toolCategory: tool.category,
    input,
    webhook,
    token,
  });

  if (!res.ok) {
    const body = await res.text();
    const mapped = mapReplicateError(new Error(`Replicate API ${res.status}`), {
      jobId: job.id,
      toolCategory: tool.category,
      model,
      version,
      httpStatus: res.status,
      apiBody: body,
    });
    console.error(mapped.logMessage, mapped.logContext);
    throw Object.assign(new Error(mapped.userMessage), {
      errorKey: mapped.errorKey,
      errorDetail: mapped.errorDetail,
      logContext: mapped.logContext,
    });
  }

  const data = (await res.json()) as { id: string };
  if (!data.id) {
    throw new Error('Replicate did not return a prediction id.');
  }

  console.log(
    `[replicate] prediction=${data.id} job=${job.id} model=${model} version=${version}`
  );
  return { id: data.id };
}

export async function getReplicatePrediction(predictionId: string): Promise<ReplicatePrediction> {
  const token = requireReplicateToken();
  const res = await fetch(`${REPLICATE_API}/predictions/${predictionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[replicate] poll error prediction=${predictionId} status=${res.status}`, body.slice(0, 200));
    throw new Error('Could not retrieve AI job status.');
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
    const model = resolveModelForJob(tool, job);
    const mapped = mapReplicateError(err, {
      jobId: job.id,
      toolCategory: tool.category,
      model,
    });
    if (!(err instanceof Error && 'logContext' in err)) {
      console.error(mapped.logMessage, mapped.logContext);
    }
    const errorKey =
      err instanceof Error && 'errorKey' in err
        ? (err as Error & { errorKey?: string }).errorKey
        : mapped.errorKey;
    const errorDetail =
      err instanceof Error && 'errorDetail' in err
        ? (err as Error & { errorDetail?: string }).errorDetail
        : mapped.errorDetail;
    return {
      status: 'failed',
      error: mapped.userMessage,
      errorKey,
      errorDetail,
    };
  }
}
