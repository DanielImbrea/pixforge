'use client';

export type SamClickType = 'include' | 'exclude';

export class SamSegmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SamSegmentError';
  }
}

const SAM_INIT_TIMEOUT_MS = 60_000;
const SAM_SEGMENT_TIMEOUT_MS = 30_000;

type MinisamModule = typeof import('minisam');
type SegmentationSession = InstanceType<MinisamModule['SegmentationSession']>;

let minisamModule: MinisamModule | null = null;
let initPromise: Promise<void> | null = null;
let activeSession: SegmentationSession | null = null;

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

/** Load SAM encoder/decoder models once (CDN-hosted by default). */
export async function ensureSamReady(): Promise<void> {
  if (!initPromise) {
    initPromise = withTimeout(
      (async () => {
        const mod = await loadMinisam();
        await mod.initSegmentation();
      })(),
      SAM_INIT_TIMEOUT_MS,
      'Smart selection model took too long to load. Try brush mode or refresh the page.'
    );
  }
  await initPromise;
}

/** Precompute image embedding so clicks feel instant after the first load. */
export async function prepareSamImage(source: HTMLCanvasElement | HTMLImageElement): Promise<void> {
  await ensureSamReady();
  const mod = await loadMinisam();
  mod.clearEmbeddingCache();
  mod.clearAllSessions();
  activeSession?.dispose();
  activeSession = null;
  await withTimeout(
    mod.precomputeEmbedding(source),
    SAM_SEGMENT_TIMEOUT_MS,
    'Smart selection timed out while preparing the image.'
  );
}

export function resetSamSession(): void {
  activeSession?.dispose();
  activeSession = null;
}

export function getSamClickCount(): number {
  return activeSession?.getClickCount() ?? 0;
}

export async function segmentSamAtClick(
  source: HTMLCanvasElement | HTMLImageElement,
  point: { x: number; y: number },
  clickType: SamClickType
): Promise<ImageData | null> {
  await ensureSamReady();
  const mod = await loadMinisam();

  if (!activeSession) {
    activeSession = mod.createSession(source);
  }

  activeSession.addClick(Math.round(point.x), Math.round(point.y), clickType);
  const mask = await withTimeout(
    activeSession.segment(source),
    SAM_SEGMENT_TIMEOUT_MS,
    'Smart selection timed out. Try another click or use the brush.'
  );
  if (!mask) {
    throw new SamSegmentError('Smart selection did not produce a mask. Try another click.');
  }
  return mask;
}

export async function undoSamClick(
  source: HTMLCanvasElement | HTMLImageElement
): Promise<ImageData | null> {
  if (!activeSession || activeSession.getClickCount() === 0) return null;
  activeSession.removeLastClick();
  if (activeSession.getClickCount() === 0) return null;
  return withTimeout(
    activeSession.segment(source),
    SAM_SEGMENT_TIMEOUT_MS,
    'Smart selection timed out while undoing.'
  );
}
