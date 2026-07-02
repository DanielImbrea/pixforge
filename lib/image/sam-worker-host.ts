'use client';

import { SamSegmentError } from '@/lib/image/sam-segment-error';

import { postprocessSamMask, postprocessSamMaskForHover } from '@/lib/tools/object-remove-sam-postprocess';

export type SamClickType = 'include' | 'exclude';

type MinisamModule = typeof import('minisam');
type SegmentationSession = InstanceType<MinisamModule['SegmentationSession']>;

let minisamModule: MinisamModule | null = null;
let initPromise: Promise<void> | null = null;
let samImage: HTMLImageElement | null = null;
let activeSession: SegmentationSession | null = null;
let hoverSession: SegmentationSession | null = null;
let embeddingReady = false;

const SAM_INIT_TIMEOUT_MS = 60_000;
const SAM_SEGMENT_TIMEOUT_MS = 45_000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new SamSegmentError(message)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function loadMinisam(): Promise<MinisamModule> {
  if (!minisamModule) {
    minisamModule = await import('minisam');
  }
  return minisamModule;
}

async function yieldToMainThread(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

async function loadImageElement(imageUrl: string): Promise<HTMLImageElement> {
  const img = new Image();
  if (!imageUrl.startsWith('blob:') && !imageUrl.startsWith('data:')) {
    img.crossOrigin = 'anonymous';
  }
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new SamSegmentError('Could not load the image for smart selection.'));
    img.src = imageUrl;
  });
  return img;
}

/** Download encoder.onnx + sam.onnx as soon as the tool page opens. */
export function preloadSamModels(): Promise<void> {
  if (!initPromise) {
    initPromise = withTimeout(
      (async () => {
        const mod = await loadMinisam();
        await mod.initSegmentation({
          sessionOptions: {
            executionProviders: ['wasm'],
            graphOptimizationLevel: 'all',
          },
        });
      })(),
      SAM_INIT_TIMEOUT_MS,
      'Smart selection model took too long to load. Try brush mode or refresh the page.'
    );
  }
  return initPromise;
}

export function isSamModelsReady(): boolean {
  return initPromise !== null;
}

export function isSamEmbeddingReady(): boolean {
  return embeddingReady;
}

export async function prepareSamImage(imageUrl: string): Promise<void> {
  await preloadSamModels();
  const mod = await loadMinisam();

  await yieldToMainThread();
  const img = await loadImageElement(imageUrl);
  samImage = img;

  mod.clearEmbeddingCache();
  mod.clearAllSessions();
  activeSession?.dispose();
  activeSession = null;
  hoverSession?.dispose();
  hoverSession = null;

  await withTimeout(
    mod.precomputeEmbedding(img),
    SAM_SEGMENT_TIMEOUT_MS,
    'Smart selection timed out while preparing the image.'
  );
  embeddingReady = true;
}

export function resetSamSession(): void {
  embeddingReady = false;
  samImage = null;
  activeSession?.dispose();
  activeSession = null;
  hoverSession?.dispose();
  hoverSession = null;
  clearSamHoverCache();
  if (minisamModule) {
    minisamModule.clearEmbeddingCache();
    minisamModule.clearAllSessions();
  }
}

export function clearSamClicks(): void {
  activeSession?.reset();
}

let hoverGeneration = 0;
let hoverSegmentCache: {
  cellKey: string;
  rawMask: ImageData;
} | null = null;

export function cancelSamHoverSegment(): number {
  hoverGeneration += 1;
  return hoverGeneration;
}

export function clearSamHoverCache(): void {
  hoverSegmentCache = null;
  cancelSamHoverSegment();
}

/** Record a confirmed click on the main session (for undo) without re-segmenting. */
export function commitSamClickForUndo(
  point: { x: number; y: number },
  clickType: SamClickType = 'include'
): void {
  if (!samImage || !embeddingReady || !minisamModule) return;
  if (!activeSession) {
    activeSession = minisamModule.createSession(samImage);
  }
  activeSession.addClick(Math.round(point.x), Math.round(point.y), clickType);
}

/**
 * Hover segment via dedicated session — reuses cached embedding, no click-session pollution.
 */
export async function segmentSamAtHover(
  point: { x: number; y: number },
  imageWidth: number,
  imageHeight: number,
  generation: number
): Promise<{ processed: ImageData; point: { x: number; y: number } } | null> {
  if (!samImage || !embeddingReady) return null;

  const { hoverCellKey } = await import('@/lib/tools/object-remove-hover-preview');
  const cellKey = hoverCellKey(point.x, point.y);

  if (hoverSegmentCache?.cellKey === cellKey) {
    const processed = postprocessSamMaskForHover(
      hoverSegmentCache.rawMask,
      point,
      imageWidth,
      imageHeight
    );
    return { processed, point };
  }

  await preloadSamModels();
  const mod = await loadMinisam();
  await yieldToMainThread();

  if (generation !== hoverGeneration) return null;

  if (!hoverSession) {
    hoverSession = mod.createSession(samImage);
  }
  hoverSession.reset();
  hoverSession.addClick(Math.round(point.x), Math.round(point.y), 'include');

  const rawMask = await withTimeout(
    hoverSession.segment(samImage),
    SAM_SEGMENT_TIMEOUT_MS,
    'Smart selection preview timed out.'
  );

  if (generation !== hoverGeneration || !rawMask) return null;

  hoverSegmentCache = { cellKey, rawMask };
  const processed = postprocessSamMaskForHover(rawMask, point, imageWidth, imageHeight);
  return { processed, point };
}

export async function segmentSamAtClick(
  _source: HTMLCanvasElement | HTMLImageElement,
  point: { x: number; y: number },
  clickType: SamClickType
): Promise<ImageData | null> {
  if (!samImage || !embeddingReady) {
    throw new SamSegmentError('Smart selection is still preparing the image. Try again in a moment.');
  }

  await preloadSamModels();
  const mod = await loadMinisam();

  if (!activeSession) {
    activeSession = mod.createSession(samImage);
  }

  await yieldToMainThread();
  activeSession.addClick(Math.round(point.x), Math.round(point.y), clickType);
  const mask = await withTimeout(
    activeSession.segment(samImage),
    SAM_SEGMENT_TIMEOUT_MS,
    'Smart selection timed out. Try another click or use the brush.'
  );
  if (!mask) {
    throw new SamSegmentError('Smart selection did not produce a mask. Try another click.');
  }
  return mask;
}

const ASSIST_OFFSETS = [
  [24, 0],
  [-24, 0],
  [0, -48],
  [0, 48],
  [0, -100],
  [0, 100],
] as const;

/**
 * Segment at click; if quality is weak, add nearby include clicks automatically (Canva-like).
 */
export async function segmentSamAtClickWithAssist(
  source: HTMLCanvasElement | HTMLImageElement,
  point: { x: number; y: number },
  clickType: SamClickType,
  imageWidth: number,
  imageHeight: number
): Promise<ImageData | null> {
  let mask = await segmentSamAtClick(source, point, clickType);
  if (!mask || clickType === 'exclude') return mask;

  const { quality } = postprocessSamMask(mask, point, {
    targetWidth: imageWidth,
    targetHeight: imageHeight,
  });
  if (quality.acceptable) return mask;

  for (const [dx, dy] of ASSIST_OFFSETS) {
    const nx = Math.max(0, Math.min(imageWidth - 1, point.x + dx));
    const ny = Math.max(0, Math.min(imageHeight - 1, point.y + dy));
    mask = await segmentSamAtClick(source, { x: nx, y: ny }, 'include');
    if (!mask) continue;
    const retry = postprocessSamMask(mask, point, {
      targetWidth: imageWidth,
      targetHeight: imageHeight,
    });
    if (retry.quality.acceptable) break;
  }

  return mask;
}

export async function undoSamClick(
  _source: HTMLCanvasElement | HTMLImageElement
): Promise<ImageData | null> {
  if (!samImage || !activeSession || activeSession.getClickCount() === 0) return null;
  activeSession.removeLastClick();
  if (activeSession.getClickCount() === 0) return null;
  await yieldToMainThread();
  return activeSession.segment(samImage);
}

export function disposeSamWorker(): void {
  resetSamSession();
  initPromise = null;
}
