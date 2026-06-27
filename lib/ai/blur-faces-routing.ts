import type { BlurCustomAction, BlurDetectionMode, BlurStrength } from '@/lib/tools/blur-faces-params';
import { blurStrengthToRadius } from '@/lib/tools/blur-faces-params';

export interface BlurFacesRouting {
  detectionMode: BlurDetectionMode;
  customAction: BlurCustomAction;
  blurStrength: BlurStrength;
  blurRadius: number;
  model: string;
  modelLabel: string;
  reasonKey: string;
  referenceAssetId?: string;
  /** Custom mode runs on-device (face match + Sharp), not Replicate. */
  usesLocalCustomPipeline?: boolean;
}

export function parseBlurFacesParams(params: Record<string, unknown>): {
  detectionMode: BlurDetectionMode;
  customAction: BlurCustomAction;
  blurStrength: BlurStrength;
  referenceAssetId?: string;
} {
  const detectionMode = params.detectionMode === 'custom' ? 'custom' : 'automatic';
  const customAction = params.customAction === 'exclude' ? 'exclude' : 'blur';
  const blurStrength =
    params.blurStrength === 'low' || params.blurStrength === 'strong'
      ? params.blurStrength
      : 'medium';
  const referenceAssetId =
    typeof params.referenceAssetId === 'string' && params.referenceAssetId.length > 0
      ? params.referenceAssetId
      : undefined;

  return { detectionMode, customAction, blurStrength, referenceAssetId };
}

function getModelLabel(
  detectionMode: BlurDetectionMode,
  customAction: BlurCustomAction
): string {
  if (detectionMode === 'custom') {
    return customAction === 'exclude'
      ? 'Custom detection · exclude reference face'
      : 'Custom detection · blur reference face';
  }
  return 'Automatic face detection';
}

function buildReasonKey(
  detectionMode: BlurDetectionMode,
  customAction: BlurCustomAction
): string {
  if (detectionMode === 'custom') {
    return customAction === 'exclude' ? 'blurFacesReasonCustomExclude' : 'blurFacesReasonCustomBlur';
  }
  return 'blurFacesReasonAutomatic';
}

export function resolveBlurFacesRoute(params: Record<string, unknown>): BlurFacesRouting {
  const parsed = parseBlurFacesParams(params);

  if (parsed.detectionMode === 'custom') {
    return {
      detectionMode: 'custom',
      customAction: parsed.customAction,
      blurStrength: parsed.blurStrength,
      blurRadius: blurStrengthToRadius(parsed.blurStrength),
      model: 'local-face-match',
      modelLabel: getModelLabel('custom', parsed.customAction),
      reasonKey: buildReasonKey('custom', parsed.customAction),
      referenceAssetId: parsed.referenceAssetId,
      usesLocalCustomPipeline: true,
    };
  }

  return {
    detectionMode: 'automatic',
    customAction: parsed.customAction,
    blurStrength: parsed.blurStrength,
    blurRadius: blurStrengthToRadius(parsed.blurStrength),
    model: 'local-face-detect',
    modelLabel: getModelLabel('automatic', parsed.customAction),
    reasonKey: buildReasonKey('automatic', parsed.customAction),
    referenceAssetId: parsed.referenceAssetId,
    usesLocalCustomPipeline: true,
  };
}

export function isCustomBlurFacesJob(params: Record<string, unknown>): boolean {
  return parseBlurFacesParams(params).detectionMode === 'custom';
}
