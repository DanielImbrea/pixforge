import {
  binaryToImageData,
  closeBinary,
  countBinaryPixels,
  dilateBinary,
  fillHolesBinary,
  keepObjectClusterAtClick,
  removeSmallComponents,
  samAlphaToBinary,
  type MaskMorphGrid,
} from '@/lib/tools/object-remove-mask-morph';

export interface SamMaskQuality {
  acceptable: boolean;
  pixelCount: number;
  coverageRatio: number;
  clickInside: boolean;
  score: number;
}

export interface PostprocessSamMaskOptions {
  /** Morphological closing radius in pixels (after upscale). */
  closeRadius?: number;
  /** Extra dilation for preview overlay completeness. */
  previewDilatePx?: number;
  /** Drop components smaller than this (pixels). */
  minComponentArea?: number;
  /** Stronger hole fill + closing when retrying. */
  aggressive?: boolean;
}

const DEFAULT_CLOSE = 5;
const AGGRESSIVE_CLOSE = 10;
const DEFAULT_PREVIEW_DILATE = 3;
const MIN_COVERAGE_RATIO = 0.0012;
const MIN_CLICK_COVERAGE = 0.0005;

function resolveCloseRadius(width: number, height: number, aggressive: boolean): number {
  const scaled = Math.max(5, Math.round(Math.min(width, height) * 0.012));
  const capped = Math.min(aggressive ? 22 : 16, scaled);
  return aggressive ? Math.max(capped, AGGRESSIVE_CLOSE) : Math.max(capped, DEFAULT_CLOSE);
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

function runPipeline(
  samMask: ImageData,
  click: { x: number; y: number },
  options: PostprocessSamMaskOptions
): MaskMorphGrid {
  const { width, height } = samMask;
  const minComponent = options.minComponentArea ?? Math.max(32, Math.round(width * height * 0.00008));
  const closeRadius =
    options.closeRadius ??
    resolveCloseRadius(width, height, Boolean(options.aggressive));
  const previewDilate = options.previewDilatePx ?? DEFAULT_PREVIEW_DILATE;

  let grid = samAlphaToBinary(samMask.data, width, height);
  grid = closeBinary(grid, closeRadius);
  grid = fillHolesBinary(grid);
  grid = closeBinary(grid, Math.max(2, Math.round(closeRadius * 0.6)));
  grid = keepObjectClusterAtClick(grid, click.x, click.y);
  grid = removeSmallComponents(grid, minComponent);
  grid = fillHolesBinary(grid);
  grid = closeBinary(grid, Math.max(2, Math.round(closeRadius * 0.5)));

  if (previewDilate > 0) {
    grid = dilateBinary(grid, previewDilate);
  }

  return grid;
}

/**
 * Premium SAM mask cleanup: close gaps, fill holes, keep click component, drop noise.
 * Returns RGBA ImageData (alpha = mask) ready for canvas apply.
 */
export function postprocessSamMask(
  samMask: ImageData,
  click: { x: number; y: number },
  options: PostprocessSamMaskOptions = {}
): { mask: ImageData; quality: SamMaskQuality } {
  let grid = runPipeline(samMask, click, options);
  let quality = assessQuality(grid, click);

  if (!quality.acceptable) {
    grid = runPipeline(samMask, click, { ...options, aggressive: true });
    const retryQuality = assessQuality(grid, click);
    if (retryQuality.score >= quality.score) {
      quality = retryQuality;
    }
  }

  return { mask: binaryToImageData(grid), quality };
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
