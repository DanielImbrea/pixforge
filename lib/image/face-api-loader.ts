import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { TextDecoder, TextEncoder } from 'util';
import sharp from 'sharp';
import type * as FaceApiTypes from '@vladmandic/face-api';

const nodeRequire = createRequire(
  typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url)
);

type FaceApiModule = typeof FaceApiTypes;
type InitMode = 'detect' | 'full';

let initPromise: Partial<Record<InitMode, Promise<void>>> = {};
let faceapi: FaceApiModule | null = null;
let detectorOptions: FaceApiTypes.SsdMobilenetv1Options | null = null;
let loadedMode: InitMode | null = null;

const VENDOR_MODEL_PATH = path.join(process.cwd(), 'lib/vendor/face-api-model');
const PUBLIC_MODEL_PATH = path.join(process.cwd(), 'public/face-api-models');
const MODEL_RELATIVE_PATH = 'node_modules/@vladmandic/face-api/model';
const JSDELIVR_MODEL_URI = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';
const TMP_MODEL_DIR = path.join(os.tmpdir(), 'pixique-face-api-model');
const MATCH_MIN_CONFIDENCE = 0.15;
const MAX_FACE_DETECT_EDGE = 1600;

const DETECT_MODEL_FILES = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model.bin',
] as const;

const FULL_MODEL_FILES = [
  ...DETECT_MODEL_FILES,
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model.bin',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model.bin',
] as const;

export type FaceWithDescriptor = FaceApiTypes.WithFaceDescriptor<
  FaceApiTypes.WithFaceLandmarks<
    { detection: FaceApiTypes.FaceDetection },
    FaceApiTypes.FaceLandmarks68
  >
>;

export type FaceInputTensor = {
  tensor: { dispose(): void };
  scale: number;
};

class NodeCanvas {
  width = 0;
  height = 0;
  getContext() {
    return {
      fillRect: () => undefined,
      drawImage: () => undefined,
      getImageData: () => ({ data: new Uint8ClampedArray(0), width: 0, height: 0 }),
      putImageData: () => undefined,
    };
  }
}

class NodeImage {
  width = 0;
  height = 0;
  src = '';
  onload: (() => void) | null = null;
}

/** Must run before face-api module init (face-api reads TextEncoder at import time). */
(function installNodeShimsSync() {
  const g = globalThis as Record<string, unknown>;
  g.TextEncoder = TextEncoder;
  g.TextDecoder = TextDecoder;
  g.window = globalThis;
  g.self = globalThis;
  g.document = { createElement: () => ({}) };
  g.navigator = { userAgent: 'node' };
})();

function getRemoteModelBaseUrls(): string[] {
  const urls: string[] = [];
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) urls.push(`https://${vercelUrl}/face-api-models`);
  urls.push('https://www.pixiqueai.com/face-api-models');
  urls.push(JSDELIVR_MODEL_URI);
  return urls;
}

async function resolveLocalModelPath(): Promise<string | null> {
  const candidates = [
    VENDOR_MODEL_PATH,
    PUBLIC_MODEL_PATH,
    (() => {
      try {
        const pkgJson = nodeRequire.resolve('@vladmandic/face-api/package.json');
        return path.join(path.dirname(pkgJson), 'model');
      } catch {
        return path.join(process.cwd(), MODEL_RELATIVE_PATH);
      }
    })(),
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(path.join(candidate, DETECT_MODEL_FILES[0]));
      return candidate;
    } catch {
      // try next
    }
  }

  return null;
}

async function downloadModelsToTmp(files: readonly string[]): Promise<string> {
  await fs.mkdir(TMP_MODEL_DIR, { recursive: true });
  const bases = getRemoteModelBaseUrls();

  for (const file of files) {
    const dest = path.join(TMP_MODEL_DIR, file);
    try {
      await fs.access(dest);
      continue;
    } catch {
      // download
    }

    let lastError: Error | null = null;
    for (const base of bases) {
      try {
        const res = await fetch(`${base}/${file}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
        lastError = null;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    if (lastError) {
      throw new Error(`Failed to download face-api model ${file}: ${lastError.message}`);
    }
  }

  return TMP_MODEL_DIR;
}

async function resolveModelPath(mode: InitMode): Promise<string> {
  const local = await resolveLocalModelPath();
  if (local) return local;

  const files = mode === 'detect' ? DETECT_MODEL_FILES : FULL_MODEL_FILES;
  return downloadModelsToTmp(files);
}

export function getFaceMatchThreshold(): number {
  return 0.55;
}

async function loadFaceApiModule(): Promise<FaceApiModule> {
  if (faceapi) return faceapi;

  faceapi = await import('@vladmandic/face-api/dist/face-api.esm.js');

  faceapi.env.monkeyPatch({
    Canvas: NodeCanvas as unknown as typeof HTMLCanvasElement,
    Image: NodeImage as unknown as typeof HTMLImageElement,
    readFile: (filePath: string) => fs.readFile(filePath),
  } as unknown as Parameters<typeof faceapi.env.monkeyPatch>[0]);

  const tf = faceapi.tf as typeof faceapi.tf & {
    setBackend(name: string): Promise<boolean>;
    ready(): Promise<void>;
  };
  await tf.setBackend('cpu');
  await tf.ready();

  return faceapi;
}

async function loadModels(mode: InitMode): Promise<void> {
  const api = await loadFaceApiModule();

  if (!loadedMode) {
    const modelPath = await resolveModelPath(mode === 'full' ? 'full' : 'detect');
    await api.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    loadedMode = 'detect';

    if (mode === 'full') {
      await api.nets.faceLandmark68Net.loadFromDisk(modelPath);
      await api.nets.faceRecognitionNet.loadFromDisk(modelPath);
      loadedMode = 'full';
    }
  } else if (loadedMode === 'detect' && mode === 'full') {
    const modelPath = await resolveModelPath('full');
    await api.nets.faceLandmark68Net.loadFromDisk(modelPath);
    await api.nets.faceRecognitionNet.loadFromDisk(modelPath);
    loadedMode = 'full';
  }

  if (!detectorOptions) {
    detectorOptions = new api.SsdMobilenetv1Options({
      minConfidence: MATCH_MIN_CONFIDENCE,
      maxResults: 20,
    });
  }
}

export async function ensureFaceApiReady(mode: InitMode = 'full'): Promise<void> {
  if (!initPromise[mode]) {
    initPromise[mode] = loadModels(mode).catch((err) => {
      initPromise[mode] = undefined;
      throw err;
    });
  }
  return initPromise[mode]!;
}

export async function bufferToFaceInput(buffer: Buffer): Promise<FaceInputTensor> {
  const api = await loadFaceApiModule();
  const oriented = await sharp(buffer).rotate().toBuffer();
  const meta = await sharp(oriented).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  if (width < 1 || height < 1) {
    throw new Error('Invalid image dimensions for face detection.');
  }

  const longEdge = Math.max(width, height);
  const scale = longEdge > MAX_FACE_DETECT_EDGE ? MAX_FACE_DETECT_EDGE / longEdge : 1;

  let pipeline = sharp(oriented).removeAlpha();
  if (scale < 1) {
    pipeline = pipeline.resize(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)), {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const rgb = await pipeline.raw().toBuffer({ resolveWithObject: true });

  return {
    tensor: api.tf.tensor3d(new Uint8Array(rgb.data), [rgb.info.height, rgb.info.width, 3]),
    scale,
  };
}

export async function detectFaceBoxes(input: FaceInputTensor): Promise<FaceApiTypes.FaceDetection[]> {
  const api = await loadFaceApiModule();
  if (!detectorOptions) {
    throw new Error('FaceAPI detector is not initialized.');
  }

  try {
    return await api.detectAllFaces(input.tensor as unknown as HTMLCanvasElement, detectorOptions);
  } finally {
    input.tensor.dispose();
  }
}

export async function detectFacesWithDescriptors(input: FaceInputTensor): Promise<FaceWithDescriptor[]> {
  const api = await loadFaceApiModule();
  if (!detectorOptions) {
    throw new Error('FaceAPI models are not initialized.');
  }

  try {
    return await api
      .detectAllFaces(input.tensor as unknown as HTMLCanvasElement, detectorOptions)
      .withFaceLandmarks()
      .withFaceDescriptors();
  } finally {
    input.tensor.dispose();
  }
}

export async function getPrimaryFaceDescriptor(input: FaceInputTensor): Promise<Float32Array | null> {
  const faces = await detectFacesWithDescriptors(input);
  if (faces.length === 0) return null;

  if (faces.length === 1) {
    return faces[0].descriptor;
  }

  const largest = faces.reduce((best, current) => {
    const bestArea = best.detection.box.width * best.detection.box.height;
    const currentArea = current.detection.box.width * current.detection.box.height;
    return currentArea > bestArea ? current : best;
  });

  return largest.descriptor;
}

export function faceDistance(a: Float32Array, b: Float32Array): number {
  if (!faceapi) {
    throw new Error('FaceAPI models are not initialized.');
  }
  return faceapi.euclideanDistance(a, b);
}
