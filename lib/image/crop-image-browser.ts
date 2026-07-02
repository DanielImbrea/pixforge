import type { CropParams } from '@/lib/tools/crop-params';
import { clampCropRect, getOrientedDimensions } from '@/lib/tools/crop-params';

/** Stay under Vercel serverless request body limit (~4.5 MB), including multipart overhead. */
export const SAFE_UPLOAD_BYTES = 4 * 1024 * 1024 - 200_000;

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image for crop.'));
    img.src = src;
  });
}

function drawRotatedImage(img: HTMLImageElement, rotate: CropParams['rotate']): HTMLCanvasElement {
  const { width, height } = getOrientedDimensions(img.naturalWidth, img.naturalHeight, rotate);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare crop canvas.');

  ctx.save();
  if (rotate === 90) {
    ctx.translate(width, 0);
    ctx.rotate(Math.PI / 2);
  } else if (rotate === 180) {
    ctx.translate(width, height);
    ctx.rotate(Math.PI);
  } else if (rotate === 270) {
    ctx.translate(0, height);
    ctx.rotate(-Math.PI / 2);
  }
  ctx.drawImage(img, 0, 0);
  ctx.restore();
  return canvas;
}

function applyFlips(
  source: HTMLCanvasElement,
  flipHorizontal: boolean,
  flipVertical: boolean
): HTMLCanvasElement {
  if (!flipHorizontal && !flipVertical) return source;

  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare flip canvas.');

  ctx.save();
  ctx.translate(flipHorizontal ? canvas.width : 0, flipVertical ? canvas.height : 0);
  ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
  ctx.drawImage(source, 0, 0);
  ctx.restore();
  return canvas;
}

function extractCropRegion(
  source: HTMLCanvasElement,
  rect: Pick<CropParams, 'left' | 'top' | 'width' | 'height'>
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = rect.width;
  canvas.height = rect.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare output canvas.');

  ctx.drawImage(
    source,
    rect.left,
    rect.top,
    rect.width,
    rect.height,
    0,
    0,
    rect.width,
    rect.height
  );
  return canvas;
}

function stemFromFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '') || 'pixiqueai-crop';
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error('Crop export failed.'))),
      mime,
      quality
    );
  });
}

async function exportCanvasUnderSizeLimit(
  canvas: HTMLCanvasElement,
  sourceMime: string,
  fileName: string,
  maxBytes: number
): Promise<File> {
  const stem = stemFromFileName(fileName);

  if (sourceMime === 'image/png') {
    const pngBlob = await canvasToBlob(canvas, 'image/png');
    if (pngBlob.size <= maxBytes) {
      return new File([pngBlob], `${stem}-crop.png`, { type: 'image/png' });
    }
  } else if (sourceMime === 'image/webp') {
    for (const quality of [0.92, 0.85, 0.75, 0.65, 0.55]) {
      const blob = await canvasToBlob(canvas, 'image/webp', quality);
      if (blob.size <= maxBytes) {
        return new File([blob], `${stem}-crop.webp`, { type: 'image/webp' });
      }
    }
  } else {
    for (const quality of [0.92, 0.85, 0.75, 0.65, 0.55, 0.45]) {
      const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
      if (blob.size <= maxBytes) {
        return new File([blob], `${stem}-crop.jpg`, { type: 'image/jpeg' });
      }
    }
  }

  const webpQualities = [0.9, 0.82, 0.72, 0.62, 0.52];
  for (const quality of webpQualities) {
    const blob = await canvasToBlob(canvas, 'image/webp', quality);
    if (blob.size <= maxBytes) {
      return new File([blob], `${stem}-crop.webp`, { type: 'image/webp' });
    }
  }

  const jpegQualities = [0.92, 0.85, 0.75, 0.65, 0.55, 0.45];
  let lastBlob: Blob | null = null;
  for (const quality of jpegQualities) {
    const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    lastBlob = blob;
    if (blob.size <= maxBytes) {
      return new File([blob], `${stem}-crop.jpg`, { type: 'image/jpeg' });
    }
  }

  if (lastBlob) {
    return new File([lastBlob], `${stem}-crop.jpg`, { type: 'image/jpeg' });
  }

  throw new Error('Crop export failed.');
}

/**
 * Apply crop transforms in the browser (matches Sharp crop pipeline) and return a
 * file small enough for serverless upload limits.
 */
export async function cropImageFileInBrowser(
  file: File,
  params: CropParams,
  maxBytes: number = SAFE_UPLOAD_BYTES
): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(url);
    const oriented = drawRotatedImage(img, params.rotate);
    const flipped = applyFlips(oriented, params.flipHorizontal, params.flipVertical);
    const rect = clampCropRect(
      {
        left: params.left,
        top: params.top,
        width: params.width,
        height: params.height,
      },
      flipped.width,
      flipped.height
    );
    const output = extractCropRegion(flipped, rect);
    return await exportCanvasUnderSizeLimit(output, file.type || 'image/jpeg', file.name, maxBytes);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Export a cropped region from a browser image URL as a File. */
export async function cropImageUrlToFile(
  imageUrl: string,
  crop: Pick<CropParams, 'left' | 'top' | 'width' | 'height'>,
  fileName: string
): Promise<File> {
  const img = await loadImageElement(imageUrl);
  const canvas = extractCropRegion(
    (() => {
      const full = document.createElement('canvas');
      full.width = img.naturalWidth;
      full.height = img.naturalHeight;
      const ctx = full.getContext('2d');
      if (!ctx) throw new Error('Could not prepare crop canvas.');
      ctx.drawImage(img, 0, 0);
      return full;
    })(),
    crop
  );

  return exportCanvasUnderSizeLimit(canvas, 'image/jpeg', fileName, SAFE_UPLOAD_BYTES);
}
