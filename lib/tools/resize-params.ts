import { computeFitInsideDimensions } from '@/lib/image/fit-inside-dimensions';

export type ResizeTargetFormat = 'original' | 'auto' | 'avif' | 'webp' | 'png' | 'jpeg';

export interface ResizeParams {
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
  targetFormat: ResizeTargetFormat;
  quality: number;
}

export interface ResizePreset {
  id: string;
  labelKey: string;
  width: number;
  height: number;
}

export const DEFAULT_RESIZE_PARAMS: ResizeParams = {
  maintainAspectRatio: true,
  targetFormat: 'original',
  quality: 85,
};

export const RESIZE_PRESETS: ResizePreset[] = [
  { id: 'instagram_post', labelKey: 'resizePresetInstagramPost', width: 1080, height: 1080 },
  { id: 'instagram_story', labelKey: 'resizePresetInstagramStory', width: 1080, height: 1920 },
  { id: 'facebook_cover', labelKey: 'resizePresetFacebookCover', width: 1640, height: 624 },
  { id: 'youtube_thumbnail', labelKey: 'resizePresetYoutubeThumbnail', width: 1280, height: 720 },
  { id: 'twitter_post', labelKey: 'resizePresetTwitterPost', width: 1600, height: 900 },
];

export const RESIZE_PERCENT_SCALES = [25, 50, 75, 200] as const;

export function clampResizeQuality(quality: number, maxQuality: number): number {
  return Math.min(Math.max(70, quality), maxQuality);
}

export function computeProjectedOutputDimensions(
  inputWidth: number,
  inputHeight: number,
  params: Pick<ResizeParams, 'width' | 'height'>
): { width: number; height: number } {
  if (!inputWidth || !inputHeight) {
    return {
      width: params.width ?? inputWidth,
      height: params.height ?? inputHeight,
    };
  }

  return computeFitInsideDimensions(inputWidth, inputHeight, params.width, params.height);
}

export function computeDimensionsForPercent(
  inputWidth: number,
  inputHeight: number,
  percent: number
): { width: number; height: number } {
  const scale = percent / 100;
  return {
    width: Math.max(1, Math.round(inputWidth * scale)),
    height: Math.max(1, Math.round(inputHeight * scale)),
  };
}

export function computeLinkedDimension(
  changed: 'width' | 'height',
  value: number,
  inputWidth: number,
  inputHeight: number
): number {
  if (!inputWidth || !inputHeight || value <= 0) return value;
  const ratio = inputWidth / inputHeight;
  if (changed === 'width') {
    return Math.max(1, Math.round(value / ratio));
  }
  return Math.max(1, Math.round(value * ratio));
}

const FORMAT_SIZE_FACTOR: Record<ResizeTargetFormat, number> = {
  original: 1,
  auto: 0.75,
  avif: 0.45,
  webp: 0.6,
  png: 1.1,
  jpeg: 0.7,
};

export function estimateOutputFileSize(
  inputBytes: number,
  inputWidth: number,
  inputHeight: number,
  outputWidth: number,
  outputHeight: number,
  quality: number,
  targetFormat: ResizeTargetFormat
): number | null {
  if (!inputBytes || !inputWidth || !inputHeight || !outputWidth || !outputHeight) {
    return null;
  }

  const pixelRatio = (outputWidth * outputHeight) / (inputWidth * inputHeight);
  const qualityFactor = Math.max(0.35, Math.min(1, quality / 100));
  const formatFactor = FORMAT_SIZE_FACTOR[targetFormat] ?? 1;
  return Math.max(1024, Math.round(inputBytes * pixelRatio * qualityFactor * formatFactor));
}

const EXT_BY_FORMAT: Record<string, string> = {
  jpeg: 'jpg',
  jpg: 'jpg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
};

export function buildResizeDownloadFilename(
  originalName: string,
  width: number,
  height: number,
  mimeType?: string
): string {
  const dotIndex = originalName.lastIndexOf('.');
  const base = (dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName)
    .replace(/[/\\]/g, '_')
    .trim() || 'image';

  let ext = 'jpg';
  if (mimeType) {
    const fromMime = mimeType.split('/')[1];
    if (fromMime) ext = EXT_BY_FORMAT[fromMime] ?? fromMime;
  } else if (dotIndex > 0) {
    ext = originalName.slice(dotIndex + 1).toLowerCase();
  }

  return `${base}_${width}x${height}.${ext}`;
}

export function readImageDimensionsFromFile(
  file: File
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}
