import type {
  PortraitEnhanceIntensity,
  PortraitEnhanceMode,
  PortraitEnhancePreset,
} from '@/lib/tools/portrait-enhance-params';

export type PortraitFeatureKey =
  | 'skin'
  | 'eyes'
  | 'lips'
  | 'teeth'
  | 'underEye'
  | 'lighting';

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceLandmarkPoint {
  x: number;
  y: number;
}

export interface DetectedFace {
  box: FaceBox;
  landmarks: FaceLandmarkPoint[];
}

export interface FaceCropRegion {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FaceQualityAssessment {
  score: number;
  needsRestore: boolean;
  blurVariance: number;
  faceResolutionScore: number;
}

export interface PortraitEnhanceContext {
  mode: PortraitEnhanceMode;
  preset: PortraitEnhancePreset;
  intensity: PortraitEnhanceIntensity;
  resolvedMode: 'enhance' | 'restore';
  quality: FaceQualityAssessment;
}

export interface RegionalMaskSet {
  skin: Buffer;
  eyes: Buffer;
  lips: Buffer;
  teeth: Buffer;
  underEye: Buffer;
  lighting: Buffer;
  face: Buffer;
}

export interface PortraitEnhanceResult {
  buffer: Buffer;
  mimeType: string;
  faceCount: number;
  resolvedMode: 'enhance' | 'restore';
  usedRestoreModel: boolean;
}

export interface PortraitEnhanceRunParams {
  inputBuffer: Buffer;
  userId: string;
  provider: 'replicate' | 'mock';
  mode: PortraitEnhanceMode;
  preset: PortraitEnhancePreset;
  intensity: PortraitEnhanceIntensity;
  restoreModel: string;
  codeformerFidelity: number;
}
