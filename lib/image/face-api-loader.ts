import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import path from 'path';
import { TextDecoder, TextEncoder } from 'util';
import sharp from 'sharp';
import type * as FaceApiTypes from '@vladmandic/face-api';

const nodeRequire = createRequire(
  typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url)
);

let initPromise: Promise<void> | null = null;
let faceapi: typeof FaceApiTypes | null = null;
let detectorOptions: FaceApiTypes.SsdMobilenetv1Options | null = null;
let shimsInstalled = false;

const MODEL_RELATIVE_PATH = 'node_modules/@vladmandic/face-api/model';
const MATCH_MIN_CONFIDENCE = 0.15;
const MAX_FACE_DETECT_EDGE = 1600;

export type FaceWithDescriptor = FaceApiTypes.WithFaceDescriptor<
  FaceApiTypes.WithFaceLandmarks<
    { detection: FaceApiTypes.FaceDetection },
    FaceApiTypes.FaceLandmarks68
  >
>;

export type FaceInputTensor = {
  tensor: { dispose(): void };
  /** Detection runs on a possibly downscaled image; multiply box coords by 1/scale for full-res blur. */
  scale: number;
};

function resolveModelPath(): string {
  try {
    const pkgJson = nodeRequire.resolve('@vladmandic/face-api/package.json');
    return path.join(path.dirname(pkgJson), 'model');
  } catch {
    return path.join(process.cwd(), MODEL_RELATIVE_PATH);
  }
}

export function getFaceMatchThreshold(): number {
  return 0.55;
}

function installNodeShims(): void {
  if (shimsInstalled) return;

  const g = globalThis as Record<string, unknown>;
  g.TextEncoder = TextEncoder;
  g.TextDecoder = TextDecoder;
  g.window = globalThis;
  g.self = globalThis;
  g.document = { createElement: () => ({}) };
  g.navigator = { userAgent: 'node' };

  shimsInstalled = true;
}

async function loadFaceApiModule(): Promise<typeof FaceApiTypes> {
  if (faceapi) return faceapi;

  installNodeShims();

  faceapi = await import('@vladmandic/face-api/dist/face-api.esm.js');

  const { Canvas, Image } = await import('@napi-rs/canvas');
  faceapi.env.monkeyPatch({
    Canvas,
    Image,
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

async function loadModels(): Promise<void> {
  const api = await loadFaceApiModule();
  const modelPath = resolveModelPath();
  try {
    await fs.access(path.join(modelPath, 'ssd_mobilenetv1_model-weights_manifest.json'));
  } catch {
    throw new Error(`Face API models not found at ${modelPath}`);
  }

  await api.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await api.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await api.nets.faceRecognitionNet.loadFromDisk(modelPath);

  detectorOptions = new api.SsdMobilenetv1Options({
    minConfidence: MATCH_MIN_CONFIDENCE,
    maxResults: 20,
  });
}

export async function ensureFaceApiReady(): Promise<void> {
  if (!initPromise) {
    initPromise = loadModels().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
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
