import type { ImageContentProfile } from '@/lib/image/classify-content';
import { getResolvedBgRemovalModels } from '@/lib/ai/replicate-models';

export type BgSubjectMode = 'product' | 'portrait' | 'object';
export type BgSubjectModeInput = 'auto' | BgSubjectMode;
export type BgEdgeQuality = 'standard' | 'high' | 'studio';
export type BgPostProcessProfile = 'product-hard' | 'portrait-soft' | 'object-balanced';

export interface BgRemovalRouting {
  subjectMode: BgSubjectMode;
  edgeQuality: BgEdgeQuality;
  model: string;
  modelLabel: string;
  reasonKey: string;
  smartMode: boolean;
  postProcess: BgPostProcessProfile;
}

function getModelForRoute(subjectMode: BgSubjectMode, edgeQuality: BgEdgeQuality): string {
  const models = getResolvedBgRemovalModels();

  if (edgeQuality === 'studio') {
    return models.studio;
  }
  if (subjectMode === 'product') {
    return models.product;
  }
  if (subjectMode === 'portrait') {
    return models.portrait;
  }
  return models.object;
}

function getModelLabel(subjectMode: BgSubjectMode, edgeQuality: BgEdgeQuality): string {
  if (edgeQuality === 'studio') {
    return 'Studio edge refinement (alpha matting)';
  }
  if (subjectMode === 'product') {
    return 'Product cutout engine (hard edges)';
  }
  if (subjectMode === 'portrait') {
    return 'Portrait matting (hair & skin safe)';
  }
  return 'Object segmentation (balanced edges)';
}

function detectSubjectMode(profile: ImageContentProfile): BgSubjectMode {
  if (profile.kind === 'logo') return 'product';
  if (profile.kind === 'photo') return 'portrait';
  if (profile.flatColorRatio > 0.55 && profile.edgeScore < 14) return 'product';
  if (profile.kind === 'screenshot') return 'object';
  return 'object';
}

function getPostProcessProfile(subjectMode: BgSubjectMode): BgPostProcessProfile {
  if (subjectMode === 'product') return 'product-hard';
  if (subjectMode === 'portrait') return 'portrait-soft';
  return 'object-balanced';
}

function buildReasonKey(
  subjectMode: BgSubjectMode,
  smartMode: boolean,
  userMode: BgSubjectModeInput
): string {
  if (!smartMode && userMode !== 'auto') {
    if (userMode === 'product') return 'bgReasonUserProduct';
    if (userMode === 'portrait') return 'bgReasonUserPortrait';
    return 'bgReasonUserObject';
  }
  if (subjectMode === 'product') return 'bgReasonProductCutout';
  if (subjectMode === 'portrait') return 'bgReasonPortraitMatting';
  return 'bgReasonObjectBalanced';
}

export function resolveBgRemovalRoute(
  profile: ImageContentProfile,
  options: {
    subjectMode?: BgSubjectModeInput;
    edgeQuality?: BgEdgeQuality;
  } = {}
): BgRemovalRouting {
  const userMode = options.subjectMode ?? 'auto';
  const edgeQuality = options.edgeQuality ?? 'high';
  const smartMode = userMode === 'auto';
  const subjectMode = smartMode ? detectSubjectMode(profile) : userMode;

  return {
    subjectMode,
    edgeQuality,
    model: getModelForRoute(subjectMode, edgeQuality),
    modelLabel: getModelLabel(subjectMode, edgeQuality),
    reasonKey: buildReasonKey(subjectMode, smartMode, userMode),
    smartMode,
    postProcess: getPostProcessProfile(subjectMode),
  };
}
