import { postprocessSamMask } from '@/lib/tools/object-remove-sam-postprocess';
import { resizeSamMaskToImage } from '@/lib/tools/object-remove-sam-resize';
import {
  HOVER_PREVIEW_FILL,
  HOVER_PREVIEW_OUTLINE,
} from '@/lib/tools/object-remove-hover-preview';

const MASK_FILL = { r: 255, g: 255, b: 255, a: 255 };
const OVERLAY_FILL = { r: 239, g: 68, b: 68, a: 128 };
const OUTLINE_COLOR = { r: 255, g: 255, b: 255, a: 220 };

function isMasked(data: Uint8ClampedArray, i: number): boolean {
  return data[i] > 32;
}

/** Stack-based flood fill region → apply to mask + overlay canvases. */
export function applyRegionToMask(
  maskCtx: CanvasRenderingContext2D,
  overlayCtx: CanvasRenderingContext2D,
  region: Uint8Array,
  width: number,
  height: number,
  subtract = false
) {
  const maskData = maskCtx.getImageData(0, 0, width, height);
  const overlayData = overlayCtx.getImageData(0, 0, width, height);

  for (let i = 0; i < region.length; i++) {
    if (!region[i]) continue;
    const pi = i * 4;
    if (subtract) {
      maskData.data[pi] = 0;
      maskData.data[pi + 1] = 0;
      maskData.data[pi + 2] = 0;
      maskData.data[pi + 3] = 255;
      overlayData.data[pi + 3] = 0;
    } else {
      maskData.data[pi] = MASK_FILL.r;
      maskData.data[pi + 1] = MASK_FILL.g;
      maskData.data[pi + 2] = MASK_FILL.b;
      maskData.data[pi + 3] = MASK_FILL.a;
      overlayData.data[pi] = OVERLAY_FILL.r;
      overlayData.data[pi + 1] = OVERLAY_FILL.g;
      overlayData.data[pi + 2] = OVERLAY_FILL.b;
      overlayData.data[pi + 3] = OVERLAY_FILL.a;
    }
  }

  maskCtx.putImageData(maskData, 0, 0);
  overlayCtx.putImageData(overlayData, 0, 0);
  drawMaskOutline(maskCtx, overlayCtx, width, height);
}

/** Resize a miniSAM mask (often 256×256) to the editor/image resolution. */
export { resizeSamMaskToImage } from '@/lib/tools/object-remove-sam-resize';

/** Apply miniSAM mask (alpha channel = foreground) to mask canvases. */
export function applySamMaskToCanvas(
  maskCtx: CanvasRenderingContext2D,
  overlayCtx: CanvasRenderingContext2D,
  samMask: ImageData,
  width: number,
  height: number,
  subtract = false
) {
  const scaledMask =
    samMask.width === width && samMask.height === height
      ? samMask
      : resizeSamMaskToImage(samMask, width, height);

  const maskData = maskCtx.getImageData(0, 0, width, height);
  const overlayData = overlayCtx.getImageData(0, 0, width, height);
  const sam = scaledMask.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const mi = (y * width + x) * 4;
      const si = (y * width + x) * 4;
      const selected = sam[si + 3] > 128;
      if (!selected) continue;

      if (subtract) {
        maskData.data[mi] = 0;
        maskData.data[mi + 1] = 0;
        maskData.data[mi + 2] = 0;
        maskData.data[mi + 3] = 255;
        overlayData.data[mi + 3] = 0;
      } else {
        maskData.data[mi] = MASK_FILL.r;
        maskData.data[mi + 1] = MASK_FILL.g;
        maskData.data[mi + 2] = MASK_FILL.b;
        maskData.data[mi + 3] = MASK_FILL.a;
        overlayData.data[mi] = OVERLAY_FILL.r;
        overlayData.data[mi + 1] = OVERLAY_FILL.g;
        overlayData.data[mi + 2] = OVERLAY_FILL.b;
        overlayData.data[mi + 3] = OVERLAY_FILL.a;
      }
    }
  }

  maskCtx.putImageData(maskData, 0, 0);
  overlayCtx.putImageData(overlayData, 0, 0);
  drawMaskOutline(maskCtx, overlayCtx, width, height);
}

/** Replace mask entirely from SAM output with premium post-processing. */
export function setMaskFromSam(
  maskCtx: CanvasRenderingContext2D,
  overlayCtx: CanvasRenderingContext2D,
  samMask: ImageData,
  width: number,
  height: number,
  click: { x: number; y: number }
) {
  const { mask: processed } = postprocessSamMask(samMask, click, {
    targetWidth: width,
    targetHeight: height,
  });

  maskCtx.fillStyle = '#000000';
  maskCtx.fillRect(0, 0, width, height);
  overlayCtx.clearRect(0, 0, width, height);
  applySamMaskToCanvas(maskCtx, overlayCtx, processed, width, height, false);
}

/** Apply an already post-processed mask as the committed selection (hover confirm). */
export function applyProcessedMaskToSelection(
  maskCtx: CanvasRenderingContext2D,
  overlayCtx: CanvasRenderingContext2D,
  processedMask: ImageData,
  width: number,
  height: number
) {
  maskCtx.fillStyle = '#000000';
  maskCtx.fillRect(0, 0, width, height);
  overlayCtx.clearRect(0, 0, width, height);
  applySamMaskToCanvas(maskCtx, overlayCtx, processedMask, width, height, false);
}

/** Purple fill + cyan outline for Smart Select hover preview (separate canvas). */
const HOVER_DRAW_MAX_PX = 720;

export function drawHoverPreviewOverlay(
  overlayCtx: CanvasRenderingContext2D,
  processedMask: ImageData,
  width: number,
  height: number
) {
  overlayCtx.clearRect(0, 0, width, height);

  const drawScale = Math.min(1, HOVER_DRAW_MAX_PX / Math.max(width, height));
  const drawW = Math.max(1, Math.round(width * drawScale));
  const drawH = Math.max(1, Math.round(height * drawScale));

  const workCanvas = document.createElement('canvas');
  workCanvas.width = drawW;
  workCanvas.height = drawH;
  const workCtx = workCanvas.getContext('2d');
  if (!workCtx) return;

  const scaled =
    processedMask.width === drawW && processedMask.height === drawH
      ? processedMask
      : resizeSamMaskToImage(processedMask, drawW, drawH);

  const overlayData = workCtx.createImageData(drawW, drawH);
  const sam = scaled.data;
  const od = overlayData.data;

  for (let y = 0; y < drawH; y++) {
    for (let x = 0; x < drawW; x++) {
      const si = (y * drawW + x) * 4;
      if (sam[si + 3] <= 128) continue;

      const oi = si;
      od[oi] = HOVER_PREVIEW_FILL.r;
      od[oi + 1] = HOVER_PREVIEW_FILL.g;
      od[oi + 2] = HOVER_PREVIEW_FILL.b;
      od[oi + 3] = HOVER_PREVIEW_FILL.a;

      const edge =
        x === 0 ||
        y === 0 ||
        x === drawW - 1 ||
        y === drawH - 1 ||
        (x > 0 && sam[si - 4 + 3] <= 128) ||
        (x < drawW - 1 && sam[si + 4 + 3] <= 128) ||
        (y > 0 && sam[si - drawW * 4 + 3] <= 128) ||
        (y < drawH - 1 && sam[si + drawW * 4 + 3] <= 128);

      if (edge) {
        od[oi] = HOVER_PREVIEW_OUTLINE.r;
        od[oi + 1] = HOVER_PREVIEW_OUTLINE.g;
        od[oi + 2] = HOVER_PREVIEW_OUTLINE.b;
        od[oi + 3] = HOVER_PREVIEW_OUTLINE.a;
      }
    }
  }

  workCtx.putImageData(overlayData, 0, 0);
  overlayCtx.imageSmoothingEnabled = false;
  overlayCtx.drawImage(workCanvas, 0, 0, width, height);
}

/** Union or subtract a SAM mask into the existing brush/click selection. */
export function mergeSamMaskIntoCanvas(
  maskCtx: CanvasRenderingContext2D,
  overlayCtx: CanvasRenderingContext2D,
  samMask: ImageData,
  width: number,
  height: number,
  subtract = false
) {
  applySamMaskToCanvas(maskCtx, overlayCtx, samMask, width, height, subtract);
}

/** Draw semi-transparent fill + white contour on masked pixels. */
export function drawMaskOutline(
  maskCtx: CanvasRenderingContext2D,
  overlayCtx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const maskData = maskCtx.getImageData(0, 0, width, height);
  const overlayData = overlayCtx.getImageData(0, 0, width, height);
  const md = maskData.data;
  const od = overlayData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (!isMasked(md, i)) continue;

      const edge =
        x === 0 ||
        y === 0 ||
        x === width - 1 ||
        y === height - 1 ||
        !isMasked(md, i - 4) ||
        !isMasked(md, i + 4) ||
        !isMasked(md, i - width * 4) ||
        !isMasked(md, i + width * 4);

      if (edge) {
        od[i] = OUTLINE_COLOR.r;
        od[i + 1] = OUTLINE_COLOR.g;
        od[i + 2] = OUTLINE_COLOR.b;
        od[i + 3] = OUTLINE_COLOR.a;
      }
    }
  }

  overlayCtx.putImageData(overlayData, 0, 0);
}

export function countMaskPixels(maskCtx: CanvasRenderingContext2D, width: number, height: number): number {
  const data = maskCtx.getImageData(0, 0, width, height).data;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 32) count += 1;
  }
  return count;
}
