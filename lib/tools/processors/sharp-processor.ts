import sharp from 'sharp';
import type { ProcessInput, ProcessResult, ToolProcessor } from '../processor';
import { classifyImageContent } from '@/lib/image/classify-content';
import {
  applyContentAwareEncode,
  applyResize,
  computeFitInsideDimensions,
  formatLabel,
  prepareForJpeg,
  readImageDimensions,
  selectSmartOutputFormat,
  type OutputFormat,
  type SharpOperation,
  type SmartFormatChoice,
} from '@/lib/image/sharp-encode';

const MIME_BY_FORMAT: Record<OutputFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
};

async function fetchAsBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch input asset: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function finalizePipeline(
  pipeline: sharp.Sharp,
  formatChoice: SmartFormatChoice,
  profile: Awaited<ReturnType<typeof classifyImageContent>>,
  operation: SharpOperation,
  outputWidth: number,
  outputHeight: number,
  qualityOverride?: number
): sharp.Sharp {
  let pipelineOut = pipeline;

  if (formatChoice.format === 'jpeg') {
    pipelineOut = prepareForJpeg(pipelineOut, profile);
  }

  return applyContentAwareEncode(pipelineOut, formatChoice.format, profile, {
    qualityOverride,
    operation,
    outputWidth,
    outputHeight,
    lossless: formatChoice.lossless,
  });
}

export const sharpProcessor: ToolProcessor = {
  async process({ job, tool, inputAssetUrl }: ProcessInput): Promise<ProcessResult> {
    try {
      const buffer = await fetchAsBuffer(inputAssetUrl);
      const inputMeta = await readImageDimensions(buffer);
      const profile = await classifyImageContent(buffer);
      let pipeline = sharp(buffer, { failOn: 'error' }).rotate();
      const params = job.params || {};
      const defaults = tool.processorConfig.sharpDefaults || {};
      const operation = tool.processorConfig.sharpOperation as SharpOperation;

      const maxDim = tool.limits.maxDimensionPx;
      if (maxDim && inputMeta.width && inputMeta.height) {
        if (inputMeta.width > maxDim || inputMeta.height > maxDim) {
          return { status: 'failed', error: 'Image dimensions exceed the allowed maximum.' };
        }
      }

      let formatChoice: SmartFormatChoice;
      let qualityOverride: number | undefined;
      let outputWidth = inputMeta.width;
      let outputHeight = inputMeta.height;

      switch (operation) {
        case 'resize': {
          let width = typeof params.width === 'number' && params.width > 0 ? params.width : undefined;
          let height = typeof params.height === 'number' && params.height > 0 ? params.height : undefined;

          if (!width && !height) {
            width = inputMeta.width ? Math.max(1, Math.round(inputMeta.width / 2)) : undefined;
            height = inputMeta.height ? Math.max(1, Math.round(inputMeta.height / 2)) : undefined;
          }

          const projected = computeFitInsideDimensions(inputMeta.width, inputMeta.height, width, height);
          outputWidth = projected.width;
          outputHeight = projected.height;

          pipeline = applyResize(pipeline, {
            width,
            height,
            fit: (defaults.fit as keyof sharp.FitEnum) || 'inside',
            withoutEnlargement:
              defaults.withoutEnlargement !== undefined ? Boolean(defaults.withoutEnlargement) : true,
            inputWidth: inputMeta.width,
            inputHeight: inputMeta.height,
          });

          formatChoice = selectSmartOutputFormat(profile, { operation: 'resize' });
          pipeline = finalizePipeline(
            pipeline,
            formatChoice,
            profile,
            'resize',
            outputWidth,
            outputHeight
          );
          break;
        }
        case 'compress': {
          qualityOverride =
            typeof params.quality === 'number'
              ? params.quality
              : typeof defaults.quality === 'number'
                ? defaults.quality
                : undefined;

          formatChoice = selectSmartOutputFormat(profile, { operation: 'compress' });
          pipeline = finalizePipeline(
            pipeline,
            formatChoice,
            profile,
            'compress',
            outputWidth,
            outputHeight,
            qualityOverride
          );
          break;
        }
        case 'convert': {
          const target =
            typeof params.targetFormat === 'string'
              ? params.targetFormat
              : typeof defaults.targetFormat === 'string'
                ? defaults.targetFormat
                : 'auto';

          formatChoice = selectSmartOutputFormat(profile, {
            userFormat: target,
            operation: 'convert',
          });
          pipeline = finalizePipeline(
            pipeline,
            formatChoice,
            profile,
            'convert',
            outputWidth,
            outputHeight
          );
          break;
        }
        default:
          return { status: 'failed', error: 'Unknown sharp operation configured for this tool.' };
      }

      const outputBuffer = await pipeline.toBuffer();
      const outputMeta = await readImageDimensions(outputBuffer);

      return {
        status: 'done',
        outputBuffer,
        outputMimeType: MIME_BY_FORMAT[formatChoice.format],
        outputWidth: outputMeta.width,
        outputHeight: outputMeta.height,
        outputSizeBytes: outputBuffer.byteLength,
        outputFormat: formatChoice.format,
        outputFormatLabel: formatLabel(formatChoice.format, formatChoice.lossless),
        smartFormatSelected: formatChoice.automatic,
        contentKind: profile.kind,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown processing error';
      return { status: 'failed', error: message };
    }
  },
};
