import type { ImageContentProfile } from '@/lib/image/classify-content';

export type UpscaleContentKind = 'photo' | 'screenshot' | 'art';
export type UpscaleScaleInput = 'smart' | 2 | 4;
export type UpscalePostProcess = 'light-sharpen' | 'artifact-soften' | 'none';

export interface UpscaleRouting {
  contentKind: UpscaleContentKind;
  model: string;
  modelLabel: string;
  scale: 2 | 4;
  faceEnhance: boolean;
  postProcess: UpscalePostProcess;
  reasonKey: string;
  warningKey?: string;
  smartMode: boolean;
}

function mapContentKind(profile: ImageContentProfile): UpscaleContentKind {
  if (profile.kind === 'photo') return 'photo';
  if (profile.kind === 'screenshot') return 'screenshot';
  return 'art';
}

function getModelForKind(kind: UpscaleContentKind): string {
  if (kind === 'photo') {
    return process.env.REPLICATE_UPSCALE_PHOTO_MODEL?.trim() || 'nightmareai/real-esrgan';
  }
  if (kind === 'screenshot') {
    return process.env.REPLICATE_UPSCALE_UI_MODEL?.trim() || 'nightmareai/real-esrgan';
  }
  return process.env.REPLICATE_UPSCALE_ART_MODEL?.trim() || 'nightmareai/real-esrgan';
}

function getModelLabel(kind: UpscaleContentKind, faceEnhance: boolean): string {
  if (kind === 'photo' && faceEnhance) {
    return 'Real-ESRGAN + face detail recovery';
  }
  if (kind === 'screenshot') {
    return 'Real-ESRGAN (UI & text clarity)';
  }
  if (kind === 'art') {
    return 'Real-ESRGAN (illustration mode)';
  }
  return 'Real-ESRGAN';
}

function resolveEffectiveScale(
  kind: UpscaleContentKind,
  scaleInput: UpscaleScaleInput,
  inputWidth?: number,
  inputHeight?: number
): { scale: 2 | 4; smartMode: boolean } {
  if (scaleInput === 2 || scaleInput === 4) {
    return { scale: scaleInput, smartMode: false };
  }

  if (kind === 'screenshot' || kind === 'art') {
    return { scale: 2, smartMode: true };
  }

  const maxDim = Math.max(inputWidth || 0, inputHeight || 0);
  if (maxDim > 0 && maxDim <= 720) {
    return { scale: 4, smartMode: true };
  }

  return { scale: 2, smartMode: true };
}

function buildReasonKey(
  kind: UpscaleContentKind,
  scale: 2 | 4,
  smartMode: boolean,
  profile: ImageContentProfile
): string {
  if (!smartMode && scale === 2) return 'upscaleReasonUser2x';
  if (!smartMode && scale === 4) return 'upscaleReasonUser4x';

  if (kind === 'photo') {
    return profile.edgeScore < 14 ? 'upscaleReasonPhotoFace' : 'upscaleReasonPhotoDetail';
  }
  if (kind === 'screenshot') {
    return profile.edgeScore >= 16 ? 'upscaleReasonScreenshotText' : 'upscaleReasonScreenshotUi';
  }
  return 'upscaleReasonArtLines';
}

export function resolveUpscaleRoute(
  profile: ImageContentProfile,
  scaleInput: UpscaleScaleInput,
  dimensions?: { width: number; height: number }
): UpscaleRouting {
  const contentKind = mapContentKind(profile);
  const { scale, smartMode } = resolveEffectiveScale(
    contentKind,
    scaleInput,
    dimensions?.width,
    dimensions?.height
  );

  const faceEnhance = contentKind === 'photo';
  const postProcess: UpscalePostProcess =
    contentKind === 'screenshot'
      ? 'light-sharpen'
      : contentKind === 'photo'
        ? 'artifact-soften'
        : 'none';

  let warningKey: string | undefined;
  if (scale === 4 && contentKind === 'screenshot') {
    warningKey = 'upscaleWarnScreenshot4x';
  } else if (scale === 4 && contentKind === 'art') {
    warningKey = 'upscaleWarnArt4x';
  }

  return {
    contentKind,
    model: getModelForKind(contentKind),
    modelLabel: getModelLabel(contentKind, faceEnhance),
    scale,
    faceEnhance,
    postProcess,
    reasonKey: buildReasonKey(contentKind, scale, smartMode, profile),
    warningKey,
    smartMode,
  };
}
