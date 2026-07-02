'use client';

import { SamSegmentError } from '@/lib/image/sam-segment-error';

import { postprocessSamMask } from '@/lib/tools/object-remove-sam-postprocess';
import { resizeSamMaskToImage } from '@/lib/tools/object-remove-mask';

export type SamClickType = 'include' | 'exclude';

type MinisamModule = typeof import('minisam');
type SegmentationSession = InstanceType<MinisamModule['SegmentationSession']>;

let minisamModule: MinisamModule | null = null;
let initPromise: Promise<void> | null = null;
let samImage: HTMLImageElement | null = null;
let activeSession: SegmentationSession | null = null;
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
  if (minisamModule) {
    minisamModule.clearEmbeddingCache();
    minisamModule.clearAllSessions();
  }
}

export function clearSamClicks(): void {
  activeSession?.reset();
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
  [20, 0],
  [-20, 0],
  [0, 20],
  [0, -20],
  [14, 14],
  [-14, -14],
  [14, -14],
  [-14, 14],
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

  const scaled = resizeSamMaskToImage(mask, imageWidth, imageHeight);
  let { quality } = postprocessSamMask(scaled, point);
  if (quality.acceptable) return mask;

  for (const [dx, dy] of ASSIST_OFFSETS) {
    const nx = Math.max(0, Math.min(imageWidth - 1, point.x + dx));
    const ny = Math.max(0, Math.min(imageHeight - 1, point.y + dy));
    mask = await segmentSamAtClick(source, { x: nx, y: ny }, 'include');
    if (!mask) continue;
    const retryScaled = resizeSamMaskToImage(mask, imageWidth, imageHeight);
    const retry = postprocessSamMask(retryScaled, point);
    if (retry.quality.score > quality.score) {
      quality = retry.quality;
    }
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
