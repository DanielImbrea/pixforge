import sharp from 'sharp';
import type { ProcessInput, ProcessResult, ToolProcessor } from '../processor';
import { applyBackgroundFill, shouldApplyBackgroundFill, type BackgroundFill } from '@/lib/image/background-fill';
import { classifyImageContent } from '@/lib/image/classify-content';
import {
  computeSizeReductionPercent,
  resolveQualityForFormat,
  type QualityIntent,
} from '@/lib/image/quality-intent';
import { clampCropRect } from '@/lib/tools/crop-params';
import {
  applyContentAwareEncode,
  applyResize,
  computeFitInsideDimensions,
  formatLabel,
  readImageDimensions,
  selectSmartOutputFormat,
  type OutputFormat,
  type SharpOperation,
  type SmartFormatChoice,
} from '@/lib/image/sharp-encode';

const MIME_BY_FORMAT: Record<string, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

function buildPreserveFormatChoice(format: OutputFormat): SmartFormatChoice {
  return {
    format,
    automatic: false,
    reason: 'user',
    reasonKey: 'formatReasonUser',
    lossless: format === 'png',
  };
}

async function encodeGifCompress(pipeline: sharp.Sharp, effort: number): Promise<Buffer> {
  return pipeline.gif({ effort, dither: 1 }).toBuffer();
}

function buildOutputFormatLabel(
  formatChoice: SmartFormatChoice,
  encodeQuality: number | null
): string {
  const base = formatLabel(formatChoice.format, formatChoice.lossless);
  if (formatChoice.lossless || encodeQuality == null) return base;
  return `${base} · ${encodeQuality}%`;
}

function wasBackgroundFillApplied(
  outputFormat: OutputFormat,
  profile: Awaited<ReturnType<typeof classifyImageContent>>,
  backgroundFill: BackgroundFill
): boolean {
  return shouldApplyBackgroundFill(profile, outputFormat, backgroundFill);
}

function formatFromSharpMeta(format: string | undefined): OutputFormat {
  if (format === 'png') return 'png';
  if (format === 'webp') return 'webp';
  if (format === 'avif') return 'avif';
  return 'jpeg';
}

async function fetchAsBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch input asset: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function encodePipeline(
  basePipeline: sharp.Sharp,
  formatChoice: SmartFormatChoice,
  profile: Awaited<ReturnType<typeof classifyImageContent>>,
  options: {
    operation: SharpOperation;
    outputWidth: number;
    outputHeight: number;
    qualityOverride?: number;
    qualityIntent?: QualityIntent;
    backgroundFill?: BackgroundFill;
    enableFallback?: boolean;
  }
): Promise<{ buffer: Buffer; formatChoice: SmartFormatChoice; encodeQuality: number | null }> {
  const formats: OutputFormat[] =
    options.enableFallback && formatChoice.format === 'avif'
      ? ['avif', 'webp', 'jpeg']
      : [formatChoice.format];

  let lastError: unknown;

  for (let i = 0; i < formats.length; i += 1) {
    const format = formats[i]!;
    const isFallback = i > 0;
    let choice = formatChoice;

    if (isFallback) {
      choice = {
        format,
        automatic: false,
        reason: 'fallback',
        reasonKey: format === 'webp' ? 'formatReasonFallbackWebp' : 'formatReasonFallbackJpeg',
        lossless: false,
      };
    }

    try {
      let pipeline = basePipeline.clone();
      const resolvedQuality = resolveQualityForFormat(
        format,
        options.qualityIntent ?? 'balanced',
        options.outputWidth,
        options.outputHeight,
        choice.lossless
      );
      const lossless = resolvedQuality.lossless ?? choice.lossless;
      const qualityOverride = options.qualityOverride ?? resolvedQuality.qualityOverride;

      if (shouldApplyBackgroundFill(profile, format, options.backgroundFill ?? 'white')) {
        pipeline = await applyBackgroundFill(pipeline, profile, options.backgroundFill ?? 'white');
      }

      pipeline = applyContentAwareEncode(pipeline, format, profile, {
        qualityOverride,
        operation: options.operation,
        outputWidth: options.outputWidth,
        outputHeight: options.outputHeight,
        lossless,
        qualityIntent: options.qualityIntent,
      });

      const buffer = await pipeline.toBuffer();
      const encodeQuality = lossless ? null : qualityOverride ?? null;
      return { buffer, formatChoice: { ...choice, lossless }, encodeQuality };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Encoding failed');
}

export const sharpProcessor: ToolProcessor = {
  async process({ job, tool, inputAssetUrl }: ProcessInput): Promise<ProcessResult> {
    try {
      const buffer = await fetchAsBuffer(inputAssetUrl);
      const inputSizeBytes = buffer.byteLength;
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
      let qualityIntent: QualityIntent = 'balanced';
      let backgroundFill: BackgroundFill = 'white';
      let outputWidth = inputMeta.width;
      let outputHeight = inputMeta.height;
      let enableFallback = false;

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

          const allowsEnlargement =
            projected.width > (inputMeta.width ?? 0) || projected.height > (inputMeta.height ?? 0);

          pipeline = applyResize(pipeline, {
            width,
            height,
            fit: (defaults.fit as keyof sharp.FitEnum) || 'inside',
            withoutEnlargement:
              allowsEnlargement
                ? false
                : defaults.withoutEnlargement !== undefined
                  ? Boolean(defaults.withoutEnlargement)
                  : true,
            inputWidth: inputMeta.width,
            inputHeight: inputMeta.height,
          });

          const targetFormat =
            typeof params.targetFormat === 'string' ? params.targetFormat : 'original';
          qualityOverride =
            typeof params.quality === 'number' ? params.quality : undefined;

          if (targetFormat === 'original') {
            const inputSharpMeta = await sharp(buffer).metadata();
            const originalFormat = formatFromSharpMeta(inputSharpMeta.format);
            formatChoice = {
              format: originalFormat,
              automatic: false,
              reason: 'user',
              reasonKey: 'formatReasonUser',
              lossless: originalFormat === 'png',
            };
          } else if (targetFormat === 'auto') {
            formatChoice = selectSmartOutputFormat(profile, { operation: 'resize' });
          } else {
            formatChoice = selectSmartOutputFormat(profile, {
              userFormat: targetFormat,
              operation: 'resize',
            });
          }

          if (qualityOverride != null && formatChoice.format !== 'png') {
            formatChoice = { ...formatChoice, lossless: false };
          }

          enableFallback = formatChoice.format === 'avif';
          break;
        }
        case 'crop': {
          const rotate =
            params.rotate === 90 || params.rotate === 180 || params.rotate === 270
              ? params.rotate
              : 0;
          const flipH = Boolean(params.flipHorizontal);
          const flipV = Boolean(params.flipVertical);

          if (rotate) {
            pipeline = pipeline.rotate(rotate);
          }
          if (flipH) {
            pipeline = pipeline.flop();
          }
          if (flipV) {
            pipeline = pipeline.flip();
          }

          const orientedMeta = await pipeline.clone().metadata();
          const orientedWidth = orientedMeta.width ?? inputMeta.width ?? 1;
          const orientedHeight = orientedMeta.height ?? inputMeta.height ?? 1;

          const rect = clampCropRect(
            {
              left: typeof params.left === 'number' ? params.left : 0,
              top: typeof params.top === 'number' ? params.top : 0,
              width:
                typeof params.width === 'number' && params.width > 0
                  ? params.width
                  : orientedWidth,
              height:
                typeof params.height === 'number' && params.height > 0
                  ? params.height
                  : orientedHeight,
            },
            orientedWidth,
            orientedHeight
          );

          pipeline = pipeline.extract(rect);
          outputWidth = rect.width;
          outputHeight = rect.height;

          const inputSharpMeta = await sharp(buffer).metadata();
          const originalFormat = formatFromSharpMeta(inputSharpMeta.format);
          formatChoice = buildPreserveFormatChoice(originalFormat);
          qualityIntent = 'balanced';
          break;
        }
        case 'compress': {
          const inputSharpMeta = await sharp(buffer).metadata();
          const rawFormat = inputSharpMeta.format;

          qualityIntent =
            params.qualityIntent === 'fast' ||
            params.qualityIntent === 'balanced' ||
            params.qualityIntent === 'max'
              ? params.qualityIntent
              : 'balanced';

          if (rawFormat === 'svg') {
            return {
              status: 'done',
              outputBuffer: buffer,
              outputMimeType: MIME_BY_FORMAT.svg,
              outputWidth: inputMeta.width,
              outputHeight: inputMeta.height,
              outputSizeBytes: inputSizeBytes,
              outputFormat: 'svg',
              keptOriginal: true,
              smartFormatSelected: false,
              formatReasonKey: 'formatReasonAlreadyOptimized',
              compressionLevel: qualityIntent,
              sizeReductionPercent: null,
              inputSizeBytes,
            };
          }

          if (rawFormat === 'gif') {
            let outputBuffer = await encodeGifCompress(pipeline, 10);
            let keptOriginal = false;

            if (outputBuffer.byteLength >= inputSizeBytes) {
              outputBuffer = await encodeGifCompress(pipeline, 7);
            }
            if (outputBuffer.byteLength >= inputSizeBytes) {
              outputBuffer = buffer;
              keptOriginal = true;
            }

            const outputMeta = await readImageDimensions(outputBuffer);
            return {
              status: 'done',
              outputBuffer,
              outputMimeType: MIME_BY_FORMAT.gif,
              outputWidth: outputMeta.width,
              outputHeight: outputMeta.height,
              outputSizeBytes: outputBuffer.byteLength,
              outputFormat: 'gif',
              keptOriginal,
              smartFormatSelected: false,
              formatReasonKey: keptOriginal ? 'formatReasonAlreadyOptimized' : undefined,
              compressionLevel: qualityIntent,
              sizeReductionPercent: computeSizeReductionPercent(inputSizeBytes, outputBuffer.byteLength),
              inputSizeBytes,
            };
          }

          const originalFormat = formatFromSharpMeta(rawFormat);
          formatChoice = buildPreserveFormatChoice(originalFormat);
          enableFallback = false;
          break;
        }
        case 'convert': {
          const target =
            typeof params.targetFormat === 'string'
              ? params.targetFormat
              : typeof defaults.targetFormat === 'string'
                ? defaults.targetFormat
                : 'auto';

          qualityIntent =
            params.qualityIntent === 'fast' ||
            params.qualityIntent === 'balanced' ||
            params.qualityIntent === 'max'
              ? params.qualityIntent
              : 'balanced';

          backgroundFill =
            params.backgroundFill === 'white' ||
            params.backgroundFill === 'black' ||
            params.backgroundFill === 'blur' ||
            params.backgroundFill === 'auto'
              ? params.backgroundFill
              : 'white';

          formatChoice = selectSmartOutputFormat(profile, {
            userFormat: target,
            operation: 'convert',
            qualityIntent,
          });
          enableFallback = target === 'auto' && formatChoice.format === 'avif';
          break;
        }
        default:
          return { status: 'failed', error: 'Unknown sharp operation configured for this tool.' };
      }

      const encoded = await encodePipeline(pipeline, formatChoice, profile, {
        operation,
        outputWidth,
        outputHeight,
        qualityOverride,
        qualityIntent,
        backgroundFill,
        enableFallback,
      });

      formatChoice = encoded.formatChoice;
      let outputBuffer = encoded.buffer;
      let encodeQuality = encoded.encodeQuality;
      let keptOriginal = false;

      if (operation === 'compress' && outputBuffer.byteLength >= inputSizeBytes) {
        const retryIntent: QualityIntent =
          qualityIntent === 'max' ? 'balanced' : qualityIntent === 'balanced' ? 'fast' : 'fast';
        if (retryIntent !== qualityIntent) {
          const retry = await encodePipeline(pipeline, formatChoice, profile, {
            operation,
            outputWidth,
            outputHeight,
            qualityIntent: retryIntent,
            backgroundFill,
            enableFallback: false,
          });
          if (retry.buffer.byteLength < outputBuffer.byteLength) {
            outputBuffer = retry.buffer;
            formatChoice = retry.formatChoice;
            encodeQuality = retry.encodeQuality;
            qualityIntent = retryIntent;
          }
        }
      }

      if (operation === 'compress' && outputBuffer.byteLength >= inputSizeBytes) {
        const inputSharpMeta = await sharp(buffer).metadata();
        outputBuffer = buffer;
        keptOriginal = true;
        formatChoice = {
          format: formatFromSharpMeta(inputSharpMeta.format),
          automatic: false,
          reason: 'fallback',
          reasonKey: 'formatReasonAlreadyOptimized',
          lossless: false,
        };
      }

      const outputMeta = await readImageDimensions(outputBuffer);
      const sizeReductionPercent = computeSizeReductionPercent(inputSizeBytes, outputBuffer.byteLength);
      const backgroundFillApplied = wasBackgroundFillApplied(
        formatChoice.format,
        profile,
        backgroundFill
      );
      const isCompressOperation = operation === 'compress';

      return {
        status: 'done',
        outputBuffer,
        outputMimeType: MIME_BY_FORMAT[formatChoice.format] ?? MIME_BY_FORMAT.jpeg,
        outputWidth: outputMeta.width,
        outputHeight: outputMeta.height,
        outputSizeBytes: outputBuffer.byteLength,
        outputFormat: formatChoice.format,
        outputFormatLabel: isCompressOperation ? undefined : buildOutputFormatLabel(formatChoice, encodeQuality),
        outputEncodeQuality: encodeQuality,
        backgroundFillApplied,
        smartFormatSelected: isCompressOperation ? false : formatChoice.automatic,
        contentKind: isCompressOperation ? undefined : profile.kind,
        formatReasonKey: isCompressOperation
          ? keptOriginal
            ? 'formatReasonAlreadyOptimized'
            : undefined
          : formatChoice.reasonKey,
        compressionLevel: isCompressOperation ? qualityIntent : undefined,
        sizeReductionPercent,
        inputSizeBytes,
        keptOriginal,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown processing error';
      return { status: 'failed', error: message };
    }
  },
};
