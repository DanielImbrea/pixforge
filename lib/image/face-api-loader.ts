import path from 'path';
import type * as FaceApiTypes from '@vladmandic/face-api';

let initPromise: Promise<void> | null = null;
let faceapi: typeof FaceApiTypes | null = null;
let detectorOptions: FaceApiTypes.SsdMobilenetv1Options | null = null;

const MODEL_RELATIVE_PATH = 'node_modules/@vladmandic/face-api/model';
const MATCH_MIN_CONFIDENCE = 0.45;

export type FaceWithDescriptor = FaceApiTypes.WithFaceDescriptor<
  FaceApiTypes.WithFaceLandmarks<
    { detection: FaceApiTypes.FaceDetection },
    FaceApiTypes.FaceLandmarks68
  >
>;

function resolveModelPath(): string {
  return path.join(process.cwd(), MODEL_RELATIVE_PATH);
}

export function getFaceMatchThreshold(): number {
  return 0.55;
}

async function loadFaceApiModule(): Promise<typeof FaceApiTypes> {
  if (faceapi) return faceapi;

  const { setWasmPaths } = await import('@tensorflow/tfjs-backend-wasm');
  await import('@tensorflow/tfjs-backend-wasm');
  const tf = await import('@tensorflow/tfjs');

  setWasmPaths(path.join(process.cwd(), 'node_modules/@tensorflow/tfjs-backend-wasm/dist/'));
  await tf.setBackend('wasm');
  await tf.ready();

  faceapi = await import('@vladmandic/face-api/dist/face-api.esm.js');

  const { Canvas, Image, ImageData } = await import('@napi-rs/canvas');
  faceapi.env.monkeyPatch({ Canvas, Image, ImageData } as unknown as typeof globalThis);

  return faceapi;
}

export async function ensureFaceApiReady(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const api = await loadFaceApiModule();
    const modelPath = resolveModelPath();
    await api.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    await api.nets.faceLandmark68Net.loadFromDisk(modelPath);
    await api.nets.faceRecognitionNet.loadFromDisk(modelPath);

    detectorOptions = new api.SsdMobilenetv1Options({
      minConfidence: MATCH_MIN_CONFIDENCE,
      maxResults: 20,
    });
  })();

  return initPromise;
}

export async function bufferToCanvas(buffer: Buffer) {
  const { Canvas, loadImage } = await import('@napi-rs/canvas');
  const img = await loadImage(buffer);
  const canvas = new Canvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return canvas;
}

export async function detectFacesWithDescriptors(
  canvas: Awaited<ReturnType<typeof bufferToCanvas>>
): Promise<FaceWithDescriptor[]> {
  const api = await loadFaceApiModule();
  if (!detectorOptions) {
    throw new Error('FaceAPI models are not initialized.');
  }

  return api
    .detectAllFaces(canvas as unknown as HTMLCanvasElement, detectorOptions)
    .withFaceLandmarks()
    .withFaceDescriptors();
}

export async function getPrimaryFaceDescriptor(
  canvas: Awaited<ReturnType<typeof bufferToCanvas>>
): Promise<Float32Array | null> {
  const faces = await detectFacesWithDescriptors(canvas);
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
