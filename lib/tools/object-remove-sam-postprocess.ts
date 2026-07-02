import {
  binaryToImageData,
  closeBinary,
  countBinaryPixels,
  dilateBinary,
  erodeBinary,
  fillHolesBinary,
  keepComponentAtPoint,
  keepObjectClusterAtClick,
  removeSmallComponents,
  samAlphaToBinary,
  type MaskMorphGrid,
} from '@/lib/tools/object-remove-mask-morph';
import { resizeSamMaskToImage } from '@/lib/tools/object-remove-sam-resize';

export interface SamMaskQuality {
  acceptable: boolean;
  pixelCount: number;
  coverageRatio: number;
  clickInside: boolean;
  score: number;
}

export interface PostprocessSamMaskOptions {
  /** Morphological closing radius in pixels (SAM resolution). */
  closeRadius?: number;
  /** Extra dilation for preview overlay completeness. */
  previewDilatePx?: number;
  /** Drop components smaller than this (pixels, SAM resolution). */
  minComponentArea?: number;
  /** Stronger hole fill + closing when retrying. */
  aggressive?: boolean;
  /** Union nearby fragments (vacuum wand + body). Off for hover preview. */
  useCluster?: boolean;
  /** Upscale result to editor image size after SAM-resolution morphology. */
  targetWidth?: number;
  targetHeight?: number;
}

const DEFAULT_CLOSE = 4;
const AGGRESSIVE_CLOSE = 7;
const DEFAULT_PREVIEW_DILATE = 1;
const MIN_COVERAGE_RATIO = 0.0012;
const MIN_CLICK_COVERAGE = 0.0005;

function resolveCloseRadius(
  width: number,
  height: number,
  aggressive: boolean,
  override?: number
): number {
  if (override !== undefined) return override;
  const scaled = Math.max(3, Math.round(Math.min(width, height) * 0.02));
  const capped = Math.min(aggressive ? 10 : 8, scaled);
  return aggressive ? Math.max(capped, AGGRESSIVE_CLOSE) : Math.max(capped, DEFAULT_CLOSE);
}

function scaleClickToMask(
  click: { x: number; y: number },
  maskWidth: number,
  maskHeight: number,
  targetWidth: number,
  targetHeight: number
): { x: number; y: number } {
  if (maskWidth === targetWidth && maskHeight === targetHeight) return click;
  return {
    x: click.x * (maskWidth / targetWidth),
    y: click.y * (maskHeight / targetHeight),
  };
}

function assessQuality(
  mask: MaskMorphGrid,
  click: { x: number; y: number }
): SamMaskQuality {
  const pixelCount = countBinaryPixels(mask);
  const coverageRatio = pixelCount / mask.data.length;
  const px = Math.max(0, Math.min(mask.width - 1, Math.round(click.x)));
  const py = Math.max(0, Math.min(mask.height - 1, Math.round(click.y)));
  const clickInside = mask.data[py * mask.width + px] === 1;

  let score = 0;
  if (clickInside) score += 0.45;
  if (coverageRatio >= MIN_COVERAGE_RATIO) score += 0.35;
  if (coverageRatio >= MIN_CLICK_COVERAGE) score += 0.1;
  if (pixelCount > 64) score += 0.1;

  const acceptable = clickInside && coverageRatio >= MIN_CLICK_COVERAGE && pixelCount > 32;

  return { acceptable, pixelCount, coverageRatio, clickInside, score };
}

/** Break thin bridges to floor/background below the click (common on product photos). */
function trimFloorBleed(
  mask: MaskMorphGrid,
  click: { x: number; y: number }
): MaskMorphGrid {
  const { width, height } = mask;
  const py = Math.max(0, Math.min(height - 1, Math.round(click.y)));
  if (py > height * 0.72) return mask;

  const eroded = erodeBinary(mask, 2);
  const trimmed = keepComponentAtPoint(eroded, click.x, click.y);
  if (countBinaryPixels(trimmed) < 24) return mask;

  return dilateBinary(trimmed, 2);
}

function runPipeline(
  samMask: ImageData,
  click: { x: number; y: number },
  options: PostprocessSamMaskOptions
): MaskMorphGrid {
  const { width, height } = samMask;
  const minComponent =
    options.minComponentArea ?? Math.max(16, Math.round(width * height * 0.00015));
  const closeRadius = resolveCloseRadius(
    width,
    height,
    Boolean(options.aggressive),
    options.closeRadius
  );
  const previewDilate = options.previewDilatePx ?? DEFAULT_PREVIEW_DILATE;
  const useCluster = options.useCluster ?? true;

  let grid = samAlphaToBinary(samMask.data, width, height);
  grid = closeBinary(grid, closeRadius);
  grid = fillHolesBinary(grid);
  grid = closeBinary(grid, Math.max(2, Math.round(closeRadius * 0.5)));

  if (useCluster) {
    grid = keepObjectClusterAtClick(grid, click.x, click.y);
  } else {
    grid = keepComponentAtPoint(grid, click.x, click.y);
  }

  grid = trimFloorBleed(grid, click);
  grid = removeSmallComponents(grid, minComponent);
  grid = fillHolesBinary(grid);
  grid = closeBinary(grid, Math.max(2, Math.round(closeRadius * 0.4)));

  if (previewDilate > 0) {
    grid = dilateBinary(grid, previewDilate);
  }

  return grid;
}

/**
 * SAM mask cleanup at native SAM resolution (~256px), then upscale once.
 * Avoids multi-megapixel morphology that blocks the UI for seconds.
 */
export function postprocessSamMask(
  samMask: ImageData,
  click: { x: number; y: number },
  options: PostprocessSamMaskOptions = {}
): { mask: ImageData; quality: SamMaskQuality } {
  const targetWidth = options.targetWidth ?? samMask.width;
  const targetHeight = options.targetHeight ?? samMask.height;
  const samClick = scaleClickToMask(click, samMask.width, samMask.height, targetWidth, targetHeight);

  let grid = runPipeline(samMask, samClick, options);
  let quality = assessQuality(grid, samClick);

  if (!quality.acceptable) {
    grid = runPipeline(samMask, samClick, { ...options, aggressive: true });
    const retryQuality = assessQuality(grid, samClick);
    if (retryQuality.score >= quality.score) {
      quality = retryQuality;
    }
  }

  let mask = binaryToImageData(grid);
  if (mask.width !== targetWidth || mask.height !== targetHeight) {
    mask = resizeSamMaskToImage(mask, targetWidth, targetHeight);
  }

  return { mask, quality };
}

/** Fast path for hover preview — no cluster, minimal morphology. */
export function postprocessSamMaskForHover(
  samMask: ImageData,
  click: { x: number; y: number },
  targetWidth: number,
  targetHeight: number
): ImageData {
  return postprocessSamMask(samMask, click, {
    targetWidth,
    targetHeight,
    useCluster: false,
    previewDilatePx: 0,
    closeRadius: 3,
    minComponentArea: 12,
  }).mask;
}

/** Centroid of SAM alpha mask — used when re-post-processing after undo. */
export function clickCentroidFromSamMask(samMask: ImageData): { x: number; y: number } {
  const { width, height, data } = samMask;
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 128) {
        sumX += x;
        sumY += y;
        count += 1;
      }
    }
  }
  if (count === 0) return { x: width / 2, y: height / 2 };
  return { x: sumX / count, y: sumY / count };
}
