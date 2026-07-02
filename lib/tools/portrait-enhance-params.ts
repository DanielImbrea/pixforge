export type PortraitEnhancePreset = 'natural' | 'glamour' | 'custom';

/** Auto picks enhance vs restore from face quality; restore uses CodeFormer only when needed. */
export type PortraitEnhanceMode = 'auto' | 'enhance' | 'restore';

export interface PortraitEnhanceIntensity {
  /** Master blend of the full face enhancement vs original (0–100). */
  overall: number;
  skin: number;
  eyes: number;
  lips: number;
  teeth: number;
  underEye: number;
  lighting: number;
}

export interface PortraitEnhanceParams {
  preset: PortraitEnhancePreset;
  mode: PortraitEnhanceMode;
  intensity: PortraitEnhanceIntensity;
  /** @deprecated Use preset — kept for backward-compatible job params. */
  enhanceStyle?: 'natural' | 'glamour';
}

export const PORTRAIT_INTENSITY_PRESETS: Record<
  Exclude<PortraitEnhancePreset, 'custom'>,
  PortraitEnhanceIntensity
> = {
  natural: {
    overall: 32,
    skin: 22,
    eyes: 28,
    lips: 12,
    teeth: 15,
    underEye: 24,
    lighting: 18,
  },
  glamour: {
    overall: 52,
    skin: 42,
    eyes: 48,
    lips: 28,
    teeth: 30,
    underEye: 38,
    lighting: 32,
  },
};

export const DEFAULT_PORTRAIT_ENHANCE_INTENSITY: PortraitEnhanceIntensity =
  PORTRAIT_INTENSITY_PRESETS.natural;

export const DEFAULT_PORTRAIT_ENHANCE_PARAMS: PortraitEnhanceParams = {
  preset: 'natural',
  mode: 'auto',
  intensity: { ...DEFAULT_PORTRAIT_ENHANCE_INTENSITY },
};

export function clampIntensity(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizePortraitEnhanceParams(
  raw: Partial<PortraitEnhanceParams> & { enhanceStyle?: 'natural' | 'glamour' }
): PortraitEnhanceParams {
  const preset: PortraitEnhancePreset =
    raw.preset ??
    (raw.enhanceStyle === 'glamour' ? 'glamour' : raw.enhanceStyle === 'natural' ? 'natural' : 'natural');

  const baseIntensity =
    preset === 'custom'
      ? { ...DEFAULT_PORTRAIT_ENHANCE_INTENSITY, ...raw.intensity }
      : { ...PORTRAIT_INTENSITY_PRESETS[preset], ...raw.intensity };

  return {
    preset,
    mode: raw.mode ?? 'auto',
    intensity: {
      overall: clampIntensity(baseIntensity.overall),
      skin: clampIntensity(baseIntensity.skin),
      eyes: clampIntensity(baseIntensity.eyes),
      lips: clampIntensity(baseIntensity.lips),
      teeth: clampIntensity(baseIntensity.teeth),
      underEye: clampIntensity(baseIntensity.underEye),
      lighting: clampIntensity(baseIntensity.lighting),
    },
  };
}

export function effectiveFeatureIntensity(
  intensity: PortraitEnhanceIntensity,
  key: keyof Omit<PortraitEnhanceIntensity, 'overall'>
): number {
  const feature = clampIntensity(intensity[key]);
  const overall = clampIntensity(intensity.overall) / 100;
  return (feature / 100) * overall;
}
