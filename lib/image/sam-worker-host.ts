'use client';

import { SamSegmentError } from '@/lib/image/sam-segment-error';

export type SamClickType = 'include' | 'exclude';

type SamWorker = Worker;

let worker: SamWorker | null = null;
let messageId = 0;
const pending = new Map<
  number,
  {
    resolve: (value: unknown) => void;
    reject: (reason: Error) => void;
  }
>();

let modelsReadyPromise: Promise<void> | null = null;
let embeddingReady = false;

function getWorker(): SamWorker {
  if (typeof window === 'undefined') {
    throw new SamSegmentError('Smart selection is only available in the browser.');
  }
  if (!worker) {
    worker = new Worker(new URL('./sam.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<{ id: number; ok: boolean; error?: string; mask?: { width: number; height: number; data: Uint8ClampedArray } }>) => {
      const { id, ok, error, mask } = event.data;
      const entry = pending.get(id);
      if (!entry) return;
      pending.delete(id);
      if (ok) {
        entry.resolve(mask ?? null);
      } else {
        entry.reject(new SamSegmentError(error || 'Smart selection failed.'));
      }
    };
    worker.onerror = (event) => {
      for (const [, entry] of pending) {
        entry.reject(new SamSegmentError(event.message || 'Smart selection worker failed.'));
      }
      pending.clear();
    };
  }
  return worker;
}

function sendWorker<T>(type: string, payload: Record<string, unknown> = {}, transfer: Transferable[] = []): Promise<T> {
  const id = ++messageId;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, {
      resolve: resolve as (value: unknown) => void,
      reject,
    });
    getWorker().postMessage({ id, type, ...payload }, transfer);
  });
}

/** Download encoder.onnx + sam.onnx as soon as the tool page opens. */
export function preloadSamModels(): Promise<void> {
  if (!modelsReadyPromise) {
    modelsReadyPromise = sendWorker<void>('init').catch((err) => {
      modelsReadyPromise = null;
      throw err;
    });
  }
  return modelsReadyPromise;
}

export function isSamModelsReady(): boolean {
  return modelsReadyPromise !== null;
}

export function isSamEmbeddingReady(): boolean {
  return embeddingReady;
}

export async function prepareSamImage(source: HTMLCanvasElement | HTMLImageElement): Promise<void> {
  await preloadSamModels();

  const width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  const bitmap = await createImageBitmap(source, { resizeWidth: width, resizeHeight: height });

  try {
    await sendWorker<void>(
      'prepare',
      { width, height, bitmap },
      [bitmap]
    );
    embeddingReady = true;
  } catch (err) {
    embeddingReady = false;
    throw err;
  }
}

export function resetSamSession(): void {
  embeddingReady = false;
  void sendWorker<void>('reset').catch(() => undefined);
}

export function clearSamClicks(): void {
  void sendWorker<void>('clear-clicks').catch(() => undefined);
}

function maskPayloadToImageData(mask: { width: number; height: number; data: Uint8ClampedArray }): ImageData {
  return new ImageData(new Uint8ClampedArray(mask.data), mask.width, mask.height);
}

export async function segmentSamAtClick(
  _source: HTMLCanvasElement | HTMLImageElement,
  point: { x: number; y: number },
  clickType: SamClickType
): Promise<ImageData | null> {
  await preloadSamModels();
  if (!embeddingReady) {
    throw new SamSegmentError('Smart selection is still preparing the image. Try again in a moment.');
  }

  const mask = await sendWorker<{ width: number; height: number; data: Uint8ClampedArray } | null>(
    'segment',
    { x: point.x, y: point.y, clickType }
  );
  if (!mask) return null;
  return maskPayloadToImageData(mask);
}

export async function undoSamClick(
  _source: HTMLCanvasElement | HTMLImageElement
): Promise<ImageData | null> {
  const mask = await sendWorker<{ width: number; height: number; data: Uint8ClampedArray } | null>('undo');
  if (!mask) return null;
  return maskPayloadToImageData(mask);
}

export function disposeSamWorker(): void {
  embeddingReady = false;
  modelsReadyPromise = null;
  if (worker) {
    worker.terminate();
    worker = null;
  }
  pending.clear();
}
