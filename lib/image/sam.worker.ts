/// <reference lib="webworker" />

import * as ort from 'onnxruntime-web';
import {
  clearAllSessions,
  clearEmbeddingCache,
  createSession,
  initSegmentation,
  precomputeEmbedding,
  type SegmentationSession,
} from 'minisam';

ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.27.0/dist/';

type SamClickType = 'include' | 'exclude';

type WorkerRequest =
  | { id: number; type: 'init' }
  | { id: number; type: 'prepare'; width: number; height: number; bitmap: ImageBitmap }
  | { id: number; type: 'segment'; x: number; y: number; clickType: SamClickType }
  | { id: number; type: 'undo' }
  | { id: number; type: 'clear-clicks' }
  | { id: number; type: 'reset' };

type WorkerResponse =
  | { id: number; ok: true; mask?: { width: number; height: number; data: Uint8ClampedArray } }
  | { id: number; ok: false; error: string };

let initPromise: Promise<void> | null = null;
let imageCanvas: OffscreenCanvas | null = null;
let activeSession: SegmentationSession | null = null;

function asMinisamCanvas(canvas: OffscreenCanvas): HTMLCanvasElement {
  return canvas as unknown as HTMLCanvasElement;
}

async function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = initSegmentation({
      sessionOptions: {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      },
    });
  }
  await initPromise;
}

function respond(payload: WorkerResponse): void {
  if (payload.ok && payload.mask) {
    self.postMessage(payload, [payload.mask.data.buffer]);
    return;
  }
  self.postMessage(payload);
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  void handleMessage(message).catch((err: unknown) => {
    const error = err instanceof Error ? err.message : 'Smart selection failed.';
    respond({ id: message.id, ok: false, error });
  });
};

async function handleMessage(message: WorkerRequest): Promise<void> {
  switch (message.type) {
    case 'init': {
      await ensureInit();
      respond({ id: message.id, ok: true });
      return;
    }
    case 'prepare': {
      await ensureInit();
      const { bitmap, width, height } = message;
      imageCanvas = new OffscreenCanvas(width, height);
      const ctx = imageCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not create offscreen canvas.');
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      clearEmbeddingCache();
      clearAllSessions();
      activeSession?.dispose();
      activeSession = null;

      await precomputeEmbedding(asMinisamCanvas(imageCanvas));
      respond({ id: message.id, ok: true });
      return;
    }
    case 'segment': {
      if (!imageCanvas) throw new Error('Image is not prepared for smart selection.');
      await ensureInit();
      if (!activeSession) {
        activeSession = createSession(asMinisamCanvas(imageCanvas));
      }
      activeSession.addClick(Math.round(message.x), Math.round(message.y), message.clickType);
      const mask = await activeSession.segment(asMinisamCanvas(imageCanvas));
      if (!mask) throw new Error('Smart selection did not produce a mask.');
      respond({
        id: message.id,
        ok: true,
        mask: { width: mask.width, height: mask.height, data: mask.data },
      });
      return;
    }
    case 'undo': {
      if (!imageCanvas || !activeSession || activeSession.getClickCount() === 0) {
        respond({ id: message.id, ok: true });
        return;
      }
      activeSession.removeLastClick();
      if (activeSession.getClickCount() === 0) {
        respond({ id: message.id, ok: true });
        return;
      }
      const mask = await activeSession.segment(asMinisamCanvas(imageCanvas));
      if (!mask) {
        respond({ id: message.id, ok: true });
        return;
      }
      respond({
        id: message.id,
        ok: true,
        mask: { width: mask.width, height: mask.height, data: mask.data },
      });
      return;
    }
    case 'clear-clicks': {
      activeSession?.reset();
      respond({ id: message.id, ok: true });
      return;
    }
    case 'reset': {
      activeSession?.dispose();
      activeSession = null;
      imageCanvas = null;
      clearEmbeddingCache();
      clearAllSessions();
      respond({ id: message.id, ok: true });
      return;
    }
    default:
      throw new Error('Unknown worker message.');
  }
};
