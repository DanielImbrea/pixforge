import sharp from 'sharp';
import type { ProcessInput, ProcessResult, ToolProcessor } from '../processor';

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
      let pipeline = sharp(buffer, { failOn: 'error' });
      const params = job.params || {};
      const defaults = tool.processorConfig.sharpDefaults || {};
      let outputFormat = 'jpeg';

      const metadata = await sharp(buffer).metadata();
      const maxDim = tool.limits.maxDimensionPx;
      if (maxDim && metadata.width && metadata.height) {
        if (metadata.width > maxDim || metadata.height > maxDim) {
          return { status: 'failed', error: 'Image dimensions exceed the allowed maximum.' };
        }
      }

      switch (tool.processorConfig.sharpOperation) {
        case 'resize': {
          let width = typeof params.width === 'number' && params.width > 0 ? params.width : undefined;
          let height = typeof params.height === 'number' && params.height > 0 ? params.height : undefined;

          if (!width && !height) {
            // No explicit target given — default to half the original size
            // rather than calling sharp.resize() with no dimensions, which
            // throws. This keeps the tool functional with zero input.
            width = metadata.width ? Math.max(1, Math.round(metadata.width / 2)) : undefined;
            height = metadata.height ? Math.max(1, Math.round(metadata.height / 2)) : undefined;
          }

          pipeline = pipeline.resize({
            width,
            height,
            fit: (defaults.fit as keyof sharp.FitEnum) || 'inside',
            withoutEnlargement:
              defaults.withoutEnlargement !== undefined ? Boolean(defaults.withoutEnlargement) : true,
          });
          outputFormat = metadata.format === 'png' ? 'png' : 'jpeg';
          pipeline = outputFormat === 'png' ? pipeline.png() : pipeline.jpeg({ quality: 90 });
          break;
        }
        case 'compress': {
          const quality =
            typeof params.quality === 'number'
              ? params.quality
              : typeof defaults.quality === 'number'
                ? defaults.quality
                : 80;
          outputFormat = metadata.format === 'png' ? 'png' : 'jpeg';
          pipeline =
            outputFormat === 'png'
              ? pipeline.png({ quality, compressionLevel: 9 })
              : pipeline.jpeg({ quality, mozjpeg: true });
          break;
        }
        case 'convert': {
          const target =
            typeof params.targetFormat === 'string'
              ? params.targetFormat
              : typeof defaults.targetFormat === 'string'
                ? defaults.targetFormat
                : 'jpeg';
          outputFormat = target;
          if (target === 'jpeg' || target === 'jpg') {
            pipeline = pipeline.flatten({ background: { r: 255, g: 255, b: 255 } }).jpeg({ quality: 90 });
            outputFormat = 'jpeg';
          } else if (target === 'png') {
            pipeline = pipeline.png();
          } else if (target === 'webp') {
            pipeline = pipeline.webp({ quality: 90 });
          } else if (target === 'avif') {
            pipeline = pipeline.avif({ quality: 80 });
          }
          break;
        }
        default:
          return { status: 'failed', error: 'Unknown sharp operation configured for this tool.' };
      }

      const outputBuffer = await pipeline.toBuffer();

      return {
        status: 'done',
        outputBuffer,
        outputMimeType: MIME_BY_FORMAT[outputFormat] || 'image/jpeg',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown processing error';
      return { status: 'failed', error: message };
    }
  },
};
