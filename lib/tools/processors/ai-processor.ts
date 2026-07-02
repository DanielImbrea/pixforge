import { getAiProvider } from '@/lib/ai/config';
import { resolveBlurFacesRoute } from '@/lib/ai/blur-faces-routing';
import { resolveBgRemovalRoute } from '@/lib/ai/bg-removal-routing';
import { mapReplicateError } from '@/lib/ai/replicate-errors';
import { submitMockJob } from '@/lib/ai/mock-provider';
import { enhancePortraitFaces } from '@/lib/ai/portrait-enhance-pipeline';
import { runObjectRemoveInpaint } from '@/lib/ai/object-remove-inpaint';
import { submitReplicateJob } from '@/lib/ai/replicate-client';
import { resolvePortraitEnhanceRoute } from '@/lib/ai/portrait-enhance-routing';
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

async function processLocalBlurFaces(
  inputAssetUrl: string,
  params: Record<string, unknown>
): Promise<ProcessResult> {
  const routing = resolveBlurFacesRoute(params);

  if (params.clientProcessed !== true) {
    return {
      status: 'failed',
      error: 'Face blur must be processed in your browser before upload.',
      errorKey: 'blurFacesErrorDetectionFailed',
      errorDetail: 'Hard-refresh the page (Ctrl+Shift+R) and try again.',
    };
  }

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

export const aiProcessor: ToolProcessor = {
  async process({ job, tool, inputAssetUrl }: ProcessInput): Promise<ProcessResult> {
    const params = (job.params || {}) as Record<string, unknown>;

    if (tool.category === 'faces') {
      return processLocalBlurFaces(inputAssetUrl, params);
    }

    if (tool.category === 'portrait_enhance') {
      const provider = getAiProvider();
      try {
        const buffer = await fetchAsBuffer(inputAssetUrl);
        const profile = await classifyImageContent(buffer);
        const routing = resolvePortraitEnhanceRoute(profile, params);
        const enhanced = await enhancePortraitFaces({
          inputBuffer: buffer,
          userId: job.user_id,
          routing,
          provider: provider === 'replicate' ? 'replicate' : 'mock',
        });

        return {
          status: 'done',
          outputBuffer: enhanced.buffer,
          outputMimeType: enhanced.mimeType,
          contentKind: profile.kind,
          portraitEnhanceReasonKey: routing.reasonKey,
          portraitEnhanceWarningKey: routing.warningKey,
          portraitEnhanceModelLabel: routing.modelLabel,
          portraitEnhanceStyle: routing.enhanceStyle,
          portraitEnhanceRouting: routing,
          inputSizeBytes: buffer.byteLength,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Portrait enhancement failed.';
        if (message.includes('No faces were detected')) {
          return {
            status: 'failed',
            error:
              'No face was detected in this image. Use a clear modern portrait or selfie where the face is visible.',
          };
        }

        if (
          message.includes('Failed to download face-api model') ||
          message.includes('FaceAPI detector is not initialized') ||
          message.includes('FaceAPI models are not initialized') ||
          message.includes('TextEncoder is not a constructor') ||
          message.includes('environment is not defined')
        ) {
          console.error('[portrait-enhance] face detection unavailable', {
            jobId: job.id,
            message,
          });
          return {
            status: 'failed',
            error: 'Face detection is temporarily unavailable. Please try again in a moment.',
            errorDetail: message,
          };
        }

        if (
          message.includes('Portrait enhancement failed (') ||
          message.includes('Portrait enhancement did not complete') ||
          message.includes('Portrait enhancement returned no image') ||
          message.includes('Model lookup failed') ||
          message.includes('has no published version')
        ) {
          const mapped = mapReplicateError(err, {
            jobId: job.id,
            toolCategory: tool.category,
            model: 'sczhou/codeformer',
          });
          console.error(mapped.logMessage, mapped.logContext);
          return {
            status: 'failed',
            error: mapped.userMessage,
            errorKey: mapped.errorKey,
            errorDetail: mapped.errorDetail,
          };
        }

        console.error('[portrait-enhance] pipeline failed', {
          jobId: job.id,
          message,
        });
        return {
          status: 'failed',
          error:
            'Portrait enhancement could not start for this image. Please try another clear selfie or portrait.',
          errorDetail: message,
        };
      }
    }

    if (tool.category === 'object_remove') {
      const maskUrl = params._maskAssetUrl as string | undefined;
      if (!maskUrl) {
        return { status: 'failed', error: 'Mask is required for object removal.' };
      }

      try {
        const [imageBuffer, maskBuffer] = await Promise.all([
          fetchAsBuffer(inputAssetUrl),
          fetchAsBuffer(maskUrl),
        ]);
        const editMode = params.editMode === 'replace' ? 'replace' : 'remove';
        const inpaintPrompt = typeof params.inpaintPrompt === 'string' ? params.inpaintPrompt : '';
        const outputBuffer = await runObjectRemoveInpaint({
          imageBuffer,
          maskBuffer,
          userId: job.user_id,
          editMode,
          prompt: inpaintPrompt,
        });

        return {
          status: 'done',
          outputBuffer,
          outputMimeType: 'image/jpeg',
          inputSizeBytes: imageBuffer.byteLength,
        };
      } catch (err) {
        const mapped = mapReplicateError(err, {
          jobId: job.id,
          toolCategory: tool.category,
          model: process.env.REPLICATE_OBJECT_REMOVE_MODEL || 'black-forest-labs/flux-fill-dev',
        });
        console.error(mapped.logMessage, mapped.logContext);
        return {
          status: 'failed',
          error: mapped.userMessage,
          errorKey: mapped.errorKey,
          errorDetail: mapped.errorDetail,
        };
      }
    }

    let workingJob = job;
    let toolMeta: Partial<ProcessResult> = {};

    if (
      tool.category === 'upscale' ||
      tool.category === 'background' ||
      tool.category === 'background_replace'
    ) {
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

      if (tool.category === 'background' || tool.category === 'background_replace') {
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
