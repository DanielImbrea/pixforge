'use client';

export type SamClickType = 'include' | 'exclude';

export class SamSegmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SamSegmentError';
  }
}

type MinisamModule = typeof import('minisam');
type SegmentationSession = InstanceType<MinisamModule['SegmentationSession']>;

let minisamModule: MinisamModule | null = null;
let initPromise: Promise<void> | null = null;
let activeSession: SegmentationSession | null = null;

async function loadMinisam(): Promise<MinisamModule> {
  if (!minisamModule) {
    minisamModule = await import('minisam');
  }
  return minisamModule;
}

/** Load SAM encoder/decoder models once (CDN-hosted by default). */
export async function ensureSamReady(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const mod = await loadMinisam();
      await mod.initSegmentation();
    })();
  }
  await initPromise;
}

/** Precompute image embedding so the first click feels instant. */
export async function prepareSamImage(source: HTMLCanvasElement | HTMLImageElement): Promise<void> {
  await ensureSamReady();
  const mod = await loadMinisam();
  mod.clearEmbeddingCache();
  mod.clearAllSessions();
  activeSession?.dispose();
  activeSession = null;
  await mod.precomputeEmbedding(source);
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
  const mask = await activeSession.segment(source);
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
  return activeSession.segment(source);
}
