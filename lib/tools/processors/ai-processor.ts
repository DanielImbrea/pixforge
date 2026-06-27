import { getAiProvider } from '@/lib/ai/config';
import { resolveBlurFacesRoute, isCustomBlurFacesJob } from '@/lib/ai/blur-faces-routing';
import { resolveBgRemovalRoute } from '@/lib/ai/bg-removal-routing';
import { submitMockJob } from '@/lib/ai/mock-provider';
import { submitReplicateJob } from '@/lib/ai/replicate-client';
import { resolveUpscaleRoute, type UpscaleScaleInput } from '@/lib/ai/upscale-routing';
import type { BgEdgeQuality, BgSubjectModeInput } from '@/lib/tools/bg-removal-params';
import { classifyImageContent } from '@/lib/image/classify-content';
import { readImageDimensions } from '@/lib/image/sharp-encode';
import type { FaceBlurError } from '@/lib/image/blur-faces-custom';
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

async function processLocalBlurFaces(
  inputAssetUrl: string,
  params: Record<string, unknown>
): Promise<ProcessResult> {
  const routing = resolveBlurFacesRoute(params);

  if (params.clientProcessed === true) {
    const inputBuffer = await fetchAsBuffer(inputAssetUrl);
    const sharp = (await import('sharp')).default;
    const meta = await sharp(inputBuffer).metadata();
    const mimeType =
      meta.format === 'png'
        ? 'image/png'
        : meta.format === 'webp'
          ? 'image/webp'
          : 'image/jpeg';
    const blurFacesCount =
      typeof params.blurFacesCount === 'number' ? params.blurFacesCount : undefined;

    return {
      status: 'done',
      outputBuffer: inputBuffer,
      outputMimeType: mimeType,
      inputSizeBytes: inputBuffer.byteLength,
      blurFacesReasonKey: routing.reasonKey,
      blurFacesModelLabel: routing.modelLabel,
      blurFacesRouting: routing,
      blurFacesCount,
    };
  }

  const isCustom = isCustomBlurFacesJob(params);
  const referenceUrl = params._referenceAssetUrl as string | undefined;

  if (isCustom && !referenceUrl) {
    return {
      status: 'failed',
      error: 'Reference portrait is required for custom detection.',
      errorKey: 'validationBlurFacesReferenceRequired',
    };
  }

  try {
    const { applyCustomFaceBlur, applyAutomaticFaceBlur, FaceBlurError } = await import(
      '@/lib/image/blur-faces-custom'
    );
    const inputBuffer = await fetchAsBuffer(inputAssetUrl);

    if (isCustom) {
      const referenceBuffer = await fetchAsBuffer(referenceUrl!);
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
    }

    const { buffer, mimeType, blurredFaceCount } = await applyAutomaticFaceBlur(
      inputBuffer,
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
    const isFaceBlur =
      err instanceof FaceBlurError ||
      (err instanceof Error &&
        err.name === 'FaceBlurError' &&
        'errorKey' in err &&
        typeof (err as FaceBlurError).errorKey === 'string');

    if (isFaceBlur) {
      const faceErr = err as FaceBlurError;
      return { status: 'failed', error: faceErr.userMessage, errorKey: faceErr.errorKey };
    }

    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('[blur-faces] local pipeline failed', { message, stack, err });
    return {
      status: 'failed',
      error: 'Face detection failed.',
      errorKey: 'blurFacesErrorDetectionFailed',
      errorDetail: message.slice(0, 300),
    };
  }
}

export const aiProcessor: ToolProcessor = {
  async process({ job, tool, inputAssetUrl }: ProcessInput): Promise<ProcessResult> {
    const params = (job.params || {}) as Record<string, unknown>;

    if (tool.category === 'faces') {
      return processLocalBlurFaces(inputAssetUrl, params);
    }

    let workingJob = job;
    let toolMeta: Partial<ProcessResult> = {};

    if (tool.category === 'upscale' || tool.category === 'background') {
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
    }

    const provider = getAiProvider();
    const result =
      provider === 'replicate'
        ? await submitReplicateJob(workingJob, tool, inputAssetUrl)
        : await submitMockJob(workingJob, tool, inputAssetUrl);

    return { ...result, ...toolMeta };
  },
};
