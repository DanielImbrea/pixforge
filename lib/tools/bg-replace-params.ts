import type { BgEdgeQuality, BgSubjectModeInput } from '@/lib/tools/bg-removal-params';

export type BgReplacePreset =
  | 'white'
  | 'studio_gray'
  | 'amazon_white'
  | 'studio_soft'
  | 'tokyo_night'
  | 'nature_jungle'
  | 'sunset_beach'
  | 'custom';

export interface BgReplaceParams {
  subjectMode: BgSubjectModeInput;
  edgeQuality: BgEdgeQuality;
  backgroundPreset: BgReplacePreset;
  backgroundPrompt: string;
}

export const DEFAULT_BG_REPLACE_PARAMS: BgReplaceParams = {
  subjectMode: 'auto',
  edgeQuality: 'high',
  backgroundPreset: 'studio_soft',
  backgroundPrompt: '',
};

export const BG_REPLACE_PRESET_PROMPTS: Record<
  Exclude<BgReplacePreset, 'custom'>,
  { prompt?: string; solid?: string }
> = {
  white: { solid: '#ffffff' },
  amazon_white: { solid: '#ffffff' },
  studio_gray: { solid: '#f3f4f6' },
  studio_soft: {
    prompt:
      'professional photography studio backdrop, soft neutral gray gradient, subtle vignette, clean product photo background',
  },
  tokyo_night: {
    prompt:
      'Tokyo city street at night, neon lights bokeh, cinematic atmosphere, shallow depth of field background for portrait',
  },
  nature_jungle: {
    prompt:
      'lush tropical jungle, soft natural daylight, green foliage bokeh, nature lifestyle background',
  },
  sunset_beach: {
    prompt:
      'golden hour sunset beach, warm soft light, ocean bokeh background, dreamy lifestyle scene',
  },
};

export function resolveBgReplacePrompt(params: BgReplaceParams): string {
  if (params.backgroundPreset === 'custom') {
    return params.backgroundPrompt.trim();
  }
  const preset = BG_REPLACE_PRESET_PROMPTS[params.backgroundPreset];
  return preset.prompt ?? '';
}

export function isSolidBgReplacePreset(preset: BgReplacePreset): boolean {
  if (preset === 'custom') return false;
  return Boolean(BG_REPLACE_PRESET_PROMPTS[preset].solid);
}

export function getSolidBgReplaceColor(preset: BgReplacePreset): string | null {
  if (preset === 'custom') return null;
  return BG_REPLACE_PRESET_PROMPTS[preset].solid ?? null;
}
