import sharp from 'sharp';
import type { ImageContentKind, ImageContentProfile } from '@/lib/image/classify-content';
import type { QualityIntent } from '@/lib/image/quality-intent';
import { computeFitInsideDimensions } from '@/lib/image/fit-inside-dimensions';

export { computeFitInsideDimensions };

export type OutputFormat = 'jpeg' | 'png' | 'webp' | 'avif';

export type SharpOperation = 'resize' | 'compress' | 'convert' | 'crop';

export type SmartFormatReason =
  | 'transparency'
  | 'photo'
  | 'screenshot'
  | 'graphic'
  | 'logo'
  | 'user'
  | 'fallback';

const SUPPORTED_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif']);

export interface SmartFormatChoice {
  format: OutputFormat;
  automatic: boolean;
  reason: SmartFormatReason;
  reasonKey: string;
  lossless: boolean;
}

export interface EncodeOptions {
  qualityOverride?: number;
  operation?: SharpOperation;
  outputWidth?: number;
  outputHeight?: number;
  lossless?: boolean;
  qualityIntent?: QualityIntent;
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

function isHighDetailText(profile: ImageContentProfile): boolean {
  return profile.kind === 'screenshot' && profile.edgeScore >= 17;
}

function userFormatChoice(profile: ImageContentProfile, userFormat: string): SmartFormatChoice {
  const format = resolveOutputFormat(userFormat);
  const lossless =
    format === 'png' ||
    (format === 'webp' &&
      (profile.kind === 'screenshot' || profile.kind === 'logo' || profile.hasTransparency));
  return {
    format,
    automatic: false,
    reason: 'user',
    reasonKey: 'formatReasonUser',
    lossless,
  };
}

/**
 * Smart format router — never choose format before classification.
 * Convert uses a full decision tree with quality intent; compress keeps modern defaults.
 */
export function selectSmartOutputFormat(
  profile: ImageContentProfile,
  options?: {
    userFormat?: string;
    operation?: SharpOperation;
    qualityIntent?: QualityIntent;
  }
): SmartFormatChoice {
  const operation = options?.operation;
  const userFormat = options?.userFormat;
  const intent = options?.qualityIntent ?? 'balanced';

  if (userFormat && userFormat !== 'auto') {
    return userFormatChoice(profile, userFormat);
  }

  const modern = usesModernCompressRouting(operation);
  const isConvert = operation === 'convert';

  if (profile.hasTransparency) {
    if (isConvert && intent === 'max') {
      return {
        format: 'png',
        automatic: true,
        reason: 'transparency',
        reasonKey: 'formatReasonTransparencyPng',
        lossless: true,
      };
    }
    if (modern) {
      return {
        format: 'webp',
        automatic: true,
        reason: 'transparency',
        reasonKey: 'formatReasonTransparencyWebp',
        lossless: true,
      };
    }
    return {
      format: 'png',
      automatic: true,
      reason: 'transparency',
      reasonKey: 'formatReasonTransparencyPng',
      lossless: true,
    };
  }

  if (profile.kind === 'logo') {
    if (isConvert && intent === 'max') {
      return {
        format: 'png',
        automatic: true,
        reason: 'logo',
        reasonKey: 'formatReasonLogoPng',
        lossless: true,
      };
    }
    if (modern) {
      return {
        format: 'webp',
        automatic: true,
        reason: 'logo',
        reasonKey: 'formatReasonLogoLossless',
        lossless: true,
      };
    }
    return {
      format: 'png',
      automatic: true,
      reason: 'logo',
      reasonKey: 'formatReasonLogoPng',
      lossless: true,
    };
  }

  if (profile.kind === 'screenshot') {
    if (isConvert && (intent === 'max' || isHighDetailText(profile))) {
      return {
        format: 'png',
        automatic: true,
        reason: 'screenshot',
        reasonKey: 'formatReasonScreenshotPng',
        lossless: true,
      };
    }
    if (modern) {
      return {
        format: 'webp',
        automatic: true,
        reason: 'screenshot',
        reasonKey: 'formatReasonScreenshotLossless',
        lossless: true,
      };
    }
    return {
      format: 'png',
      automatic: true,
      reason: 'screenshot',
      reasonKey: 'formatReasonScreenshotPng',
      lossless: true,
    };
  }

  if (profile.kind === 'photo') {
    if (isConvert && intent === 'fast') {
      return {
        format: 'webp',
        automatic: true,
        reason: 'photo',
        reasonKey: 'formatReasonPhotoWebpFast',
        lossless: false,
      };
    }
    if (modern) {
      return {
        format: 'avif',
        automatic: true,
        reason: 'photo',
        reasonKey: intent === 'max' ? 'formatReasonPhotoAvifMax' : 'formatReasonPhotoAvif',
        lossless: false,
      };
    }
    return {
      format: 'jpeg',
      automatic: true,
      reason: 'photo',
      reasonKey: 'formatReasonPhotoJpeg',
      lossless: false,
    };
  }

  if (isConvert && intent === 'max') {
    return {
      format: 'png',
      automatic: true,
      reason: 'graphic',
      reasonKey: 'formatReasonGraphicPng',
      lossless: true,
    };
  }

  if (modern) {
    return {
      format: 'webp',
      automatic: true,
      reason: 'graphic',
      reasonKey: 'formatReasonGraphicWebp',
      lossless: isConvert ? false : true,
    };
  }

  return {
    format: 'webp',
    automatic: true,
    reason: 'graphic',
    reasonKey: 'formatReasonGraphicWebp',
    lossless: false,
  };
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

/** @deprecated Use applyBackgroundFill from background-fill.ts */
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
