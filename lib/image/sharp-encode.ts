import sharp from 'sharp';
import type { ImageContentKind, ImageContentProfile } from '@/lib/image/classify-content';

export type OutputFormat = 'jpeg' | 'png' | 'webp' | 'avif';

export type SharpOperation = 'resize' | 'compress' | 'convert';

export type SmartFormatReason = 'transparency' | 'photo' | 'screenshot' | 'graphic' | 'logo' | 'user';

const SUPPORTED_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif']);

export interface SmartFormatChoice {
  format: OutputFormat;
  automatic: boolean;
  reason: SmartFormatReason;
  lossless: boolean;
}

export interface EncodeOptions {
  qualityOverride?: number;
  operation?: SharpOperation;
  outputWidth?: number;
  outputHeight?: number;
  lossless?: boolean;
}

export function formatLabel(format: OutputFormat, lossless = false): string {
  if (format === 'jpeg') return 'JPEG';
  if (format === 'png') return 'PNG';
  if (format === 'webp') return lossless ? 'WebP (lossless)' : 'WebP';
  return 'AVIF';
}

export function resolveOutputFormat(input: string | undefined): OutputFormat {
  if (input === 'jpg') return 'jpeg';
  if (input && SUPPORTED_FORMATS.has(input)) {
    return input as OutputFormat;
  }
  return 'jpeg';
}

function usesModernCompressRouting(operation?: SharpOperation): boolean {
  return operation === 'compress' || operation === 'convert';
}

/**
 * Smart format router — never choose format before classification.
 * Compress/convert use modern codecs (AVIF photos, lossless WebP for UI).
 */
export function selectSmartOutputFormat(
  profile: ImageContentProfile,
  options?: {
    userFormat?: string;
    operation?: SharpOperation;
  }
): SmartFormatChoice {
  const operation = options?.operation;
  const userFormat = options?.userFormat;

  if (userFormat && userFormat !== 'auto') {
    const format = resolveOutputFormat(userFormat);
    const lossless =
      format === 'png' ||
      (format === 'webp' &&
        (profile.kind === 'screenshot' || profile.kind === 'logo' || profile.hasTransparency));
    return { format, automatic: false, reason: 'user', lossless };
  }

  const modern = usesModernCompressRouting(operation);

  if (profile.hasTransparency) {
    if (modern) {
      return { format: 'webp', automatic: true, reason: 'transparency', lossless: true };
    }
    return { format: 'png', automatic: true, reason: 'transparency', lossless: true };
  }

  if (profile.kind === 'logo') {
    if (modern) {
      return { format: 'webp', automatic: true, reason: 'logo', lossless: true };
    }
    return { format: 'png', automatic: true, reason: 'logo', lossless: true };
  }

  if (profile.kind === 'screenshot') {
    if (modern) {
      return { format: 'webp', automatic: true, reason: 'screenshot', lossless: true };
    }
    return { format: 'png', automatic: true, reason: 'screenshot', lossless: true };
  }

  if (profile.kind === 'photo') {
    if (modern) {
      return { format: 'avif', automatic: true, reason: 'photo', lossless: false };
    }
    return { format: 'jpeg', automatic: true, reason: 'photo', lossless: false };
  }

  if (modern) {
    return { format: 'webp', automatic: true, reason: 'graphic', lossless: true };
  }

  return { format: 'webp', automatic: true, reason: 'graphic', lossless: false };
}

/** AVIF quality 60 ≈ JPEG 85 visually — scale by output size. */
export function dynamicAvifQuality(width: number, height: number): number {
  const maxDim = Math.max(width, height);
  if (maxDim < 500) return 52;
  if (maxDim < 1500) return 58;
  return 65;
}

export function dynamicWebpPhotoQuality(width: number, height: number): number {
  const maxDim = Math.max(width, height);
  if (maxDim < 500) return 70;
  if (maxDim < 1500) return 78;
  return 82;
}

export function dynamicJpegPhotoQuality(width: number, height: number): number {
  const maxDim = Math.max(width, height);
  if (maxDim < 500) return 72;
  if (maxDim < 1500) return 80;
  return 88;
}

export function dynamicScreenshotJpegQuality(width: number, height: number): number {
  const maxDim = Math.max(width, height);
  if (maxDim < 500) return 88;
  if (maxDim < 1500) return 92;
  return 95;
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

/** Content- and size-aware encode with perceptual quality tuning. */
export function applyContentAwareEncode(
  pipeline: sharp.Sharp,
  format: OutputFormat,
  profile: ImageContentProfile,
  options: EncodeOptions = {}
): sharp.Sharp {
  const width = options.outputWidth ?? 0;
  const height = options.outputHeight ?? 0;
  const isCompress = options.operation === 'compress' || options.operation === 'convert';
  const useLossless =
    options.lossless ??
    (format === 'png' ||
      (format === 'webp' &&
        (profile.kind === 'screenshot' || profile.kind === 'logo' || profile.hasTransparency)));

  switch (format) {
    case 'png':
      return pipeline.png({
        compressionLevel: isCompress ? 9 : profile.kind === 'screenshot' ? 6 : 8,
        adaptiveFiltering: true,
        effort: 8,
      });
    case 'webp':
      if (useLossless) {
        return pipeline.webp({ lossless: true, effort: 5 });
      }
      return pipeline.webp({
        quality: options.qualityOverride ?? dynamicWebpPhotoQuality(width, height),
        effort: 5,
        smartSubsample: profile.kind === 'photo',
        nearLossless: profile.kind === 'graphic',
      });
    case 'avif':
      return pipeline.avif({
        quality: options.qualityOverride ?? dynamicAvifQuality(width, height),
        effort: 4,
        chromaSubsampling: '4:2:0',
      });
    case 'jpeg':
    default: {
      if (profile.kind === 'photo') {
        return pipeline.jpeg({
          quality: options.qualityOverride ?? dynamicJpegPhotoQuality(width, height),
          mozjpeg: true,
          chromaSubsampling: '4:2:0',
          trellisQuantisation: true,
        });
      }

      return pipeline.jpeg({
        quality: options.qualityOverride ?? dynamicScreenshotJpegQuality(width, height),
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
