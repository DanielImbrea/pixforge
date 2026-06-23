import sharp from 'sharp';
import type { ImageContentKind, ImageContentProfile } from '@/lib/image/classify-content';

export type OutputFormat = 'jpeg' | 'png' | 'webp' | 'avif';

const SUPPORTED_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif']);

export type SmartFormatReason = 'transparency' | 'photo' | 'screenshot' | 'graphic' | 'user';

export interface SmartFormatChoice {
  format: OutputFormat;
  automatic: boolean;
  reason: SmartFormatReason;
}

export function formatLabel(format: OutputFormat): string {
  if (format === 'jpeg') return 'JPEG';
  if (format === 'png') return 'PNG';
  if (format === 'webp') return 'WebP';
  return 'AVIF';
}

export function resolveOutputFormat(input: string | undefined): OutputFormat {
  if (input === 'jpg') return 'jpeg';
  if (input && SUPPORTED_FORMATS.has(input)) {
    return input as OutputFormat;
  }
  return 'jpeg';
}

export function selectSmartOutputFormat(
  profile: ImageContentProfile,
  userFormat?: string
): SmartFormatChoice {
  if (userFormat && userFormat !== 'auto') {
    return {
      format: resolveOutputFormat(userFormat),
      automatic: false,
      reason: 'user',
    };
  }

  if (profile.hasTransparency) {
    return { format: 'png', automatic: true, reason: 'transparency' };
  }

  if (profile.kind === 'photo') {
    return { format: 'jpeg', automatic: true, reason: 'photo' };
  }

  if (profile.kind === 'screenshot') {
    return { format: 'png', automatic: true, reason: 'screenshot' };
  }

  return { format: 'webp', automatic: true, reason: 'graphic' };
}

export function computeFitInsideDimensions(
  inputWidth: number,
  inputHeight: number,
  targetWidth?: number,
  targetHeight?: number
): { width: number; height: number } {
  if (!targetWidth && !targetHeight) {
    return { width: inputWidth, height: inputHeight };
  }

  const ratio = inputWidth / inputHeight;

  if (targetWidth && targetHeight) {
    const widthScale = targetWidth / inputWidth;
    const heightScale = targetHeight / inputHeight;
    const scale = Math.min(widthScale, heightScale);
    return {
      width: Math.max(1, Math.round(inputWidth * scale)),
      height: Math.max(1, Math.round(inputHeight * scale)),
    };
  }

  if (targetWidth && !targetHeight) {
    return {
      width: targetWidth,
      height: Math.max(1, Math.round(targetWidth / ratio)),
    };
  }

  if (!targetWidth && targetHeight) {
    return {
      width: Math.max(1, Math.round(targetHeight * ratio)),
      height: targetHeight,
    };
  }

  return { width: inputWidth, height: inputHeight };
}

export function selectResizeKernel(
  inputWidth: number,
  inputHeight: number,
  targetWidth?: number,
  targetHeight?: number
): keyof sharp.KernelEnum {
  if (!inputWidth || !inputHeight) {
    return sharp.kernel.lanczos3;
  }

  const projected = computeFitInsideDimensions(inputWidth, inputHeight, targetWidth, targetHeight);
  const scaleX = projected.width / inputWidth;
  const scaleY = projected.height / inputHeight;
  const scale = Math.max(scaleX, scaleY);

  if (scale > 1.001) {
    return sharp.kernel.mitchell;
  }

  return sharp.kernel.lanczos3;
}

export function applyResize(
  pipeline: sharp.Sharp,
  options: {
    width?: number;
    height?: number;
    fit?: keyof sharp.FitEnum;
    withoutEnlargement?: boolean;
    inputWidth: number;
    inputHeight: number;
  }
): sharp.Sharp {
  const kernel = selectResizeKernel(options.inputWidth, options.inputHeight, options.width, options.height);

  return pipeline.resize({
    width: options.width,
    height: options.height,
    fit: options.fit || 'inside',
    withoutEnlargement: options.withoutEnlargement ?? true,
    kernel,
    fastShrinkOnLoad: true,
  });
}

export function prepareForJpeg(pipeline: sharp.Sharp, profile: ImageContentProfile): sharp.Sharp {
  if (profile.hasTransparency || profile.hasAlpha) {
    return pipeline.flatten({ background: { r: 255, g: 255, b: 255 } });
  }
  return pipeline;
}

/** Content-aware encode — photos vs screenshots use different JPEG subsampling. */
export function applyContentAwareEncode(
  pipeline: sharp.Sharp,
  format: OutputFormat,
  profile: ImageContentProfile,
  qualityOverride?: number
): sharp.Sharp {
  switch (format) {
    case 'png':
      return pipeline.png({
        compressionLevel: profile.kind === 'screenshot' ? 6 : 8,
        adaptiveFiltering: true,
        effort: 8,
      });
    case 'webp':
      return pipeline.webp({
        quality: qualityOverride ?? (profile.kind === 'photo' ? 85 : 90),
        effort: 5,
        smartSubsample: profile.kind === 'photo',
        nearLossless: profile.kind !== 'photo',
      });
    case 'avif':
      return pipeline.avif({
        quality: qualityOverride ?? 80,
        effort: 4,
        chromaSubsampling: profile.kind === 'photo' ? '4:2:0' : '4:4:4',
      });
    case 'jpeg':
    default: {
      if (profile.kind === 'photo') {
        return pipeline.jpeg({
          quality: qualityOverride ?? 85,
          mozjpeg: true,
          chromaSubsampling: '4:2:0',
          trellisQuantisation: true,
        });
      }

      return pipeline.jpeg({
        quality: qualityOverride ?? 95,
        mozjpeg: true,
        chromaSubsampling: '4:4:4',
        trellisQuantisation: true,
        overshootDeringing: true,
      });
    }
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

export type { ImageContentKind, ImageContentProfile };
