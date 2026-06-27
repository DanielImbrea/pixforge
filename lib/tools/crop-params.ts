export type CropAspectRatio =
  | 'free'
  | '1:1'
  | '4:3'
  | '3:2'
  | '16:9'
  | '9:16'
  | '4:5'
  | '3:4';

export interface CropParams {
  left: number;
  top: number;
  width: number;
  height: number;
  aspectRatio: CropAspectRatio;
  rotate: 0 | 90 | 180 | 270;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export const DEFAULT_CROP_PARAMS: CropParams = {
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  aspectRatio: 'free',
  rotate: 0,
  flipHorizontal: false,
  flipVertical: false,
};

export const CROP_ASPECT_RATIOS: CropAspectRatio[] = [
  'free',
  '1:1',
  '4:3',
  '3:2',
  '16:9',
  '9:16',
  '4:5',
  '3:4',
];

export function parseAspectRatioValue(ratio: CropAspectRatio): number | null {
  if (ratio === 'free') return null;
  const [w, h] = ratio.split(':').map(Number);
  if (!w || !h) return null;
  return w / h;
}

/** Dimensions after EXIF-aware rotate (matches Sharp crop pipeline). */
export function getOrientedDimensions(
  imageWidth: number,
  imageHeight: number,
  rotate: CropParams['rotate']
): { width: number; height: number } {
  if (rotate === 90 || rotate === 270) {
    return { width: imageHeight, height: imageWidth };
  }
  return { width: imageWidth, height: imageHeight };
}

export function buildCropPreviewTransform(params: Pick<CropParams, 'rotate' | 'flipHorizontal' | 'flipVertical'>): string | undefined {
  const parts: string[] = [];
  if (params.rotate) parts.push(`rotate(${params.rotate}deg)`);
  if (params.flipHorizontal) parts.push('scaleX(-1)');
  if (params.flipVertical) parts.push('scaleY(-1)');
  return parts.length > 0 ? parts.join(' ') : undefined;
}

export function clampCropRect(
  rect: Pick<CropParams, 'left' | 'top' | 'width' | 'height'>,
  imageWidth: number,
  imageHeight: number
): Pick<CropParams, 'left' | 'top' | 'width' | 'height'> {
  const left = Math.max(0, Math.min(Math.round(rect.left), imageWidth - 1));
  const top = Math.max(0, Math.min(Math.round(rect.top), imageHeight - 1));
  const maxWidth = imageWidth - left;
  const maxHeight = imageHeight - top;
  const width = Math.max(1, Math.min(Math.round(rect.width), maxWidth));
  const height = Math.max(1, Math.min(Math.round(rect.height), maxHeight));
  return { left, top, width, height };
}

/** Move a fixed-size crop box — only clamp position, never shrink width/height. */
export function clampCropMove(
  rect: Pick<CropParams, 'left' | 'top' | 'width' | 'height'>,
  imageWidth: number,
  imageHeight: number
): Pick<CropParams, 'left' | 'top' | 'width' | 'height'> {
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const maxLeft = Math.max(0, imageWidth - width);
  const maxTop = Math.max(0, imageHeight - height);
  const left = Math.max(0, Math.min(Math.round(rect.left), maxLeft));
  const top = Math.max(0, Math.min(Math.round(rect.top), maxTop));
  return { left, top, width, height };
}

export function initCropRectForImage(
  imageWidth: number,
  imageHeight: number,
  aspectRatio: CropAspectRatio = 'free'
): Pick<CropParams, 'left' | 'top' | 'width' | 'height'> {
  const ratio = parseAspectRatioValue(aspectRatio);
  if (!ratio) {
    return { left: 0, top: 0, width: imageWidth, height: imageHeight };
  }

  let width = imageWidth;
  let height = Math.round(width / ratio);
  if (height > imageHeight) {
    height = imageHeight;
    width = Math.round(height * ratio);
  }
  const left = Math.round((imageWidth - width) / 2);
  const top = Math.round((imageHeight - height) / 2);
  return clampCropMove({ left, top, width, height }, imageWidth, imageHeight);
}
