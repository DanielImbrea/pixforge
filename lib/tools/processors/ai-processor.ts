import { getAiProvider } from '@/lib/ai/config';
import { resolveBlurFacesRoute, isCustomBlurFacesJob } from '@/lib/ai/blur-faces-routing';
import { resolveBgRemovalRoute } from '@/lib/ai/bg-removal-routing';
import { submitMockJob } from '@/lib/ai/mock-provider';
import { submitReplicateJob } from '@/lib/ai/replicate-client';
import { resolveUpscaleRoute, type UpscaleScaleInput } from '@/lib/ai/upscale-routing';
import type { BgEdgeQuality, BgSubjectModeInput } from '@/lib/tools/bg-removal-params';
import { classifyImageContent } from '@/lib/image/classify-content';
import { readImageDimensions } from '@/lib/image/sharp-encode';
import type { ProcessInput, ProcessResult, ToolProcessor } from '../processor';
import { fetchAsBuffer } from '@/lib/ai/fetch-image';

export { applyMockAiTransform } from '@/lib/ai/mock-provider';
export { fetchAsBuffer } from '@/lib/ai/fetch-image';

function parseUpscaleScaleInput(params: Record<string, unknown>): UpscaleScaleInput {
  if (params.scale === 'smart' || params.scale === 2 || params.scale === 4) {
    return params.scale;
  }
  return 'smart';
}

function parseBgRemovalParams(params: Record<string, unknown>): {
  subjectMode: BgSubjectModeInput;
  edgeQuality: BgEdgeQuality;
} {
  const subjectMode =
    params.subjectMode === 'auto' ||
    params.subjectMode === 'product' ||
    params.subjectMode === 'portrait' ||
    params.subjectMode === 'object'
      ? params.subjectMode
      : 'auto';

  const edgeQuality =
    params.edgeQuality === 'standard' ||
    params.edgeQuality === 'high' ||
    params.edgeQuality === 'studio'
      ? params.edgeQuality
      : 'high';

  return { subjectMode, edgeQuality };
}

async function processCustomBlurFaces(
  job: ProcessInput['job'],
  inputAssetUrl: string,
  params: Record<string, unknown>
): Promise<ProcessResult> {
  const routing = resolveBlurFacesRoute(params);
  const referenceUrl = params._referenceAssetUrl as string | undefined;

  if (!referenceUrl) {
    return {
      status: 'failed',
      error: 'Reference portrait is required for custom detection.',
    };
  }

  try {
    const { applyCustomFaceBlur, FaceBlurError } = await import('@/lib/image/blur-faces-custom');
    const [inputBuffer, referenceBuffer] = await Promise.all([
      fetchAsBuffer(inputAssetUrl),
      fetchAsBuffer(referenceUrl),
    ]);

    const { buffer, mimeType, blurredFaceCount } = await applyCustomFaceBlur(
      inputBuffer,
      referenceBuffer,
      routing
    );

    return {
      status: 'done',
      outputBuffer: buffer,
      outputMimeType: mimeType,
      inputSizeBytes: inputBuffer.byteLength,
      blurFacesReasonKey: routing.reasonKey,
      blurFacesModelLabel: routing.modelLabel,
      blurFacesRouting: routing,
      blurFacesCount: blurredFaceCount,
    };
  } catch (err) {
    const { FaceBlurError } = await import('@/lib/image/blur-faces-custom');
    if (err instanceof FaceBlurError) {
      return { status: 'failed', error: err.userMessage };
    }
    console.error('[blur-faces] custom pipeline failed', err);
    return {
      status: 'failed',
      error: 'Face detection failed.',
    };
  }
}

export const aiProcessor: ToolProcessor = {
  async process({ job, tool, inputAssetUrl }: ProcessInput): Promise<ProcessResult> {
    const params = (job.params || {}) as Record<string, unknown>;

    if (tool.category === 'faces' && isCustomBlurFacesJob(params)) {
      return processCustomBlurFaces(job, inputAssetUrl, params);
    }

    let workingJob = job;
    let toolMeta: Partial<ProcessResult> = {};

    if (tool.category === 'upscale' || tool.category === 'background' || tool.category === 'faces') {
      const buffer = await fetchAsBuffer(inputAssetUrl);
      const profile = await classifyImageContent(buffer);

      if (tool.category === 'upscale') {
        const dimensions = await readImageDimensions(buffer);
        const scaleInput = parseUpscaleScaleInput(params);
        const routing = resolveUpscaleRoute(profile, scaleInput, {
          width: dimensions.width,
          height: dimensions.height,
        });

        workingJob = {
          ...job,
          params: { ...params, _upscaleRouting: routing },
        };

        toolMeta = {
          contentKind: routing.contentKind,
          upscaleReasonKey: routing.reasonKey,
          upscaleWarningKey: routing.warningKey,
          upscaleModelLabel: routing.modelLabel,
          upscaleEffectiveScale: routing.scale,
          upscaleSmartMode: routing.smartMode,
          upscaleRouting: routing,
        };
      }

      if (tool.category === 'background') {
        const bgParams = parseBgRemovalParams(params);
        const routing = resolveBgRemovalRoute(profile, bgParams);

        workingJob = {
          ...job,
          params: { ...params, _bgRemovalRouting: routing },
        };

        toolMeta = {
          contentKind: routing.subjectMode,
          bgRemovalReasonKey: routing.reasonKey,
          bgRemovalModelLabel: routing.modelLabel,
          bgRemovalSubjectMode: routing.subjectMode,
          bgRemovalEdgeQuality: routing.edgeQuality,
          bgRemovalSmartMode: routing.smartMode,
          bgRemovalRouting: routing,
        };
      }

      if (tool.category === 'faces') {
        const routing = resolveBlurFacesRoute(params);

        workingJob = {
          ...job,
          params: { ...params, _blurFacesRouting: routing },
        };

        toolMeta = {
          blurFacesReasonKey: routing.reasonKey,
          blurFacesModelLabel: routing.modelLabel,
          blurFacesRouting: routing,
        };
      }
    }

    const provider = getAiProvider();
    const result =
      provider === 'replicate'
        ? await submitReplicateJob(workingJob, tool, inputAssetUrl)
        : await submitMockJob(workingJob, tool, inputAssetUrl);

    return { ...result, ...toolMeta };
  },
};
