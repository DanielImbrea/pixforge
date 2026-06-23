import sharp from 'sharp';

export type OutputFormat = 'jpeg' | 'png' | 'webp' | 'avif';

const SUPPORTED_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif']);

export function resolveOutputFormat(inputFormat: string | undefined): OutputFormat {
  if (inputFormat && SUPPORTED_FORMATS.has(inputFormat)) {
    return inputFormat as OutputFormat;
  }
  return 'jpeg';
}

export const RESIZE_KERNEL = sharp.kernel.lanczos3;

export function applyResize(
  pipeline: sharp.Sharp,
  options: {
    width?: number;
    height?: number;
    fit?: keyof sharp.FitEnum;
    withoutEnlargement?: boolean;
  }
): sharp.Sharp {
  return pipeline.resize({
    width: options.width,
    height: options.height,
    fit: options.fit || 'inside',
    withoutEnlargement: options.withoutEnlargement ?? true,
    kernel: RESIZE_KERNEL,
    fastShrinkOnLoad: true,
  });
}

/** High-fidelity encode settings for professional delivery. */
export function applyFormatEncode(
  pipeline: sharp.Sharp,
  format: OutputFormat,
  quality?: number
): sharp.Sharp {
  switch (format) {
    case 'png':
      return pipeline.png({
        compressionLevel: 6,
        adaptiveFiltering: true,
        effort: 8,
      });
    case 'webp':
      return pipeline.webp({
        quality: quality ?? 92,
        effort: 5,
        smartSubsample: false,
        nearLossless: false,
      });
    case 'avif':
      return pipeline.avif({
        quality: quality ?? 85,
        effort: 4,
        chromaSubsampling: '4:4:4',
      });
    case 'jpeg':
    default:
      return pipeline.jpeg({
        quality: quality ?? 92,
        mozjpeg: true,
        chromaSubsampling: '4:4:4',
        trellisQuantisation: true,
        overshootDeringing: true,
      });
  }
}

export async function readImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number; format: string | undefined }> {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format,
  };
}
