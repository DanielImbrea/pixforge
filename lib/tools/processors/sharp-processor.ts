import sharp from 'sharp';
import type { ProcessInput, ProcessResult, ToolProcessor } from '../processor';
import { classifyImageContent } from '@/lib/image/classify-content';
import {
  applyContentAwareEncode,
  applyResize,
  formatLabel,
  prepareForJpeg,
  readImageDimensions,
  selectSmartOutputFormat,
  type OutputFormat,
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

function resolveFormatChoice(
  profile: Awaited<ReturnType<typeof classifyImageContent>>,
  userFormat?: string
): SmartFormatChoice {
  return selectSmartOutputFormat(profile, userFormat);
}

function finalizePipeline(
  pipeline: sharp.Sharp,
  format: OutputFormat,
  profile: Awaited<ReturnType<typeof classifyImageContent>>,
  quality?: number
): sharp.Sharp {
  if (format === 'jpeg') {
    pipeline = prepareForJpeg(pipeline, profile);
  }
  return applyContentAwareEncode(pipeline, format, profile, quality);
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

      const maxDim = tool.limits.maxDimensionPx;
      if (maxDim && inputMeta.width && inputMeta.height) {
        if (inputMeta.width > maxDim || inputMeta.height > maxDim) {
          return { status: 'failed', error: 'Image dimensions exceed the allowed maximum.' };
        }
      }

      let formatChoice: SmartFormatChoice;
      let quality: number | undefined;

      switch (tool.processorConfig.sharpOperation) {
        case 'resize': {
          let width = typeof params.width === 'number' && params.width > 0 ? params.width : undefined;
          let height = typeof params.height === 'number' && params.height > 0 ? params.height : undefined;

          if (!width && !height) {
            width = inputMeta.width ? Math.max(1, Math.round(inputMeta.width / 2)) : undefined;
            height = inputMeta.height ? Math.max(1, Math.round(inputMeta.height / 2)) : undefined;
          }

          pipeline = applyResize(pipeline, {
            width,
            height,
            fit: (defaults.fit as keyof sharp.FitEnum) || 'inside',
            withoutEnlargement:
              defaults.withoutEnlargement !== undefined ? Boolean(defaults.withoutEnlargement) : true,
            inputWidth: inputMeta.width,
            inputHeight: inputMeta.height,
          });

          formatChoice = resolveFormatChoice(profile);
          pipeline = finalizePipeline(pipeline, formatChoice.format, profile);
          break;
        }
        case 'compress': {
          quality =
            typeof params.quality === 'number'
              ? params.quality
              : typeof defaults.quality === 'number'
                ? defaults.quality
                : undefined;

          formatChoice = resolveFormatChoice(profile);
          pipeline = finalizePipeline(pipeline, formatChoice.format, profile, quality);
          break;
        }
        case 'convert': {
          const target =
            typeof params.targetFormat === 'string'
              ? params.targetFormat
              : typeof defaults.targetFormat === 'string'
                ? defaults.targetFormat
                : 'auto';

          formatChoice = resolveFormatChoice(profile, target);
          pipeline = finalizePipeline(pipeline, formatChoice.format, profile);
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
        outputFormatLabel: formatLabel(formatChoice.format),
        smartFormatSelected: formatChoice.automatic,
        contentKind: profile.kind,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown processing error';
      return { status: 'failed', error: message };
    }
  },
};
