import sharp from 'sharp';
import type { ProcessInput, ProcessResult, ToolProcessor } from '../processor';
import {
  applyFormatEncode,
  applyResize,
  readImageDimensions,
  resolveOutputFormat,
} from '@/lib/image/sharp-encode';

const MIME_BY_FORMAT: Record<string, string> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
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

export const sharpProcessor: ToolProcessor = {
  async process({ job, tool, inputAssetUrl }: ProcessInput): Promise<ProcessResult> {
    try {
      const buffer = await fetchAsBuffer(inputAssetUrl);
      const inputMeta = await readImageDimensions(buffer);
      let pipeline = sharp(buffer, { failOn: 'error' }).rotate();
      const params = job.params || {};
      const defaults = tool.processorConfig.sharpDefaults || {};
      let outputFormat = resolveOutputFormat(inputMeta.format);

      const maxDim = tool.limits.maxDimensionPx;
      if (maxDim && inputMeta.width && inputMeta.height) {
        if (inputMeta.width > maxDim || inputMeta.height > maxDim) {
          return { status: 'failed', error: 'Image dimensions exceed the allowed maximum.' };
        }
      }

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
          });

          if (outputFormat === 'jpeg' && inputMeta.format === 'png') {
            outputFormat = 'png';
          }

          if (outputFormat === 'jpeg') {
            pipeline = pipeline.flatten({ background: { r: 255, g: 255, b: 255 } });
          }

          pipeline = applyFormatEncode(pipeline, outputFormat);
          break;
        }
        case 'compress': {
          const quality =
            typeof params.quality === 'number'
              ? params.quality
              : typeof defaults.quality === 'number'
                ? defaults.quality
                : 85;

          if (outputFormat === 'jpeg') {
            pipeline = applyFormatEncode(pipeline, 'jpeg', quality);
          } else if (outputFormat === 'png') {
            pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true, effort: 8 });
          } else if (outputFormat === 'webp') {
            pipeline = applyFormatEncode(pipeline, 'webp', quality);
          } else if (outputFormat === 'avif') {
            pipeline = applyFormatEncode(pipeline, 'avif', quality);
          }
          break;
        }
        case 'convert': {
          const target =
            typeof params.targetFormat === 'string'
              ? params.targetFormat
              : typeof defaults.targetFormat === 'string'
                ? defaults.targetFormat
                : 'jpeg';
          outputFormat = resolveOutputFormat(target === 'jpg' ? 'jpeg' : target);

          if (outputFormat === 'jpeg') {
            pipeline = pipeline.flatten({ background: { r: 255, g: 255, b: 255 } });
          }

          pipeline = applyFormatEncode(pipeline, outputFormat);
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
        outputMimeType: MIME_BY_FORMAT[outputFormat] || 'image/jpeg',
        outputWidth: outputMeta.width,
        outputHeight: outputMeta.height,
        outputSizeBytes: outputBuffer.byteLength,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown processing error';
      return { status: 'failed', error: message };
    }
  },
};
