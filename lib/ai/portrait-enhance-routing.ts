import type { ImageContentProfile } from '@/lib/image/classify-content';
import {
  normalizePortraitEnhanceParams,
  type PortraitEnhanceIntensity,
  type PortraitEnhanceMode,
  type PortraitEnhanceParams,
  type PortraitEnhancePreset,
} from '@/lib/tools/portrait-enhance-params';

export interface PortraitEnhanceRouting {
  mode: PortraitEnhanceMode;
  preset: PortraitEnhancePreset;
  intensity: PortraitEnhanceIntensity;
  /** Resolved at runtime per face — enhance (regional) or restore (CodeFormer). */
  expectedMode: 'enhance' | 'restore';
  restoreModel: string;
  restoreModelLabel: string;
  codeformerFidelity: number;
  reasonKey: string;
  warningKey?: string;
  /** @deprecated */
  enhanceStyle?: 'natural' | 'glamour';
  /** @deprecated */
  model?: string;
  /** @deprecated */
  modelLabel?: string;
  faceUpsample?: boolean;
  backgroundEnhance?: boolean;
}

function getRestoreModel(): string {
  return process.env.REPLICATE_PORTRAIT_ENHANCE_MODEL?.trim() || 'sczhou/codeformer';
}

const REASON_BY_PRESET: Record<PortraitEnhancePreset, string> = {
  natural: 'portraitEnhanceReasonNatural',
  glamour: 'portraitEnhanceReasonGlamour',
  custom: 'portraitEnhanceReasonCustom',
};

export function resolvePortraitEnhanceRoute(
  profile: ImageContentProfile,
  params: Partial<PortraitEnhanceParams> & { enhanceStyle?: 'natural' | 'glamour' } = {}
): PortraitEnhanceRouting {
  const normalized = normalizePortraitEnhanceParams(params);
  const warningKey = profile.kind !== 'photo' ? 'portraitEnhanceWarnNotPhoto' : undefined;
  const restoreModel = getRestoreModel();

  const expectedMode: 'enhance' | 'restore' =
    normalized.mode === 'restore' ? 'restore' : normalized.mode === 'enhance' ? 'enhance' : 'enhance';

  return {
    mode: normalized.mode,
    preset: normalized.preset,
    intensity: normalized.intensity,
    expectedMode,
    restoreModel,
    restoreModelLabel: 'CodeFormer (restore only)',
    codeformerFidelity: normalized.preset === 'glamour' ? 0.82 : 0.88,
    reasonKey: REASON_BY_PRESET[normalized.preset],
    warningKey,
    enhanceStyle: normalized.preset === 'glamour' ? 'glamour' : 'natural',
    model: restoreModel,
    modelLabel: 'Regional portrait enhance',
    faceUpsample: false,
    backgroundEnhance: false,
  };
}
