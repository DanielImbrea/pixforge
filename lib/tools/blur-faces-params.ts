export type BlurStrength = 'low' | 'medium' | 'strong';
export type BlurDetectionMode = 'automatic' | 'custom';
export type BlurCustomAction = 'blur' | 'exclude';

export interface BlurFacesParams {
  detectionMode: BlurDetectionMode;
  blurStrength: BlurStrength;
  customAction: BlurCustomAction;
  referenceAssetId?: string;
}

export const DEFAULT_BLUR_FACES_PARAMS: BlurFacesParams = {
  detectionMode: 'automatic',
  blurStrength: 'medium',
  customAction: 'blur',
};

/** Maps UI strength to Replicate `blur` radius (kharioki/blur-faces and similar). */
export function blurStrengthToRadius(strength: BlurStrength): number {
  if (strength === 'low') return 8;
  if (strength === 'strong') return 28;
  return 15;
}

/** Maps UI strength to Sharp Gaussian sigma for on-device custom blur. */
export function blurStrengthToSigma(strength: BlurStrength): number {
  if (strength === 'low') return 4;
  if (strength === 'strong') return 14;
  return 8;
}
