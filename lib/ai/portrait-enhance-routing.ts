import type { ImageContentProfile } from '@/lib/image/classify-content';
import type { PortraitEnhanceStyle } from '@/lib/tools/portrait-enhance-params';

export interface PortraitEnhanceRouting {
  model: string;
  modelLabel: string;
  enhanceStyle: PortraitEnhanceStyle;
  codeformerFidelity: number;
  faceUpsample: boolean;
  backgroundEnhance: boolean;
  reasonKey: string;
  warningKey?: string;
}

function getPortraitEnhanceModel(): string {
  return process.env.REPLICATE_PORTRAIT_ENHANCE_MODEL?.trim() || 'sczhou/codeformer';
}

function parseEnhanceStyle(value: unknown): PortraitEnhanceStyle {
  if (value === 'glamour' || value === 'restore') return value;
  return 'natural';
}

const FIDELITY_BY_STYLE: Record<PortraitEnhanceStyle, number> = {
  natural: 0.78,
  glamour: 0.68,
  restore: 0.85,
};

const REASON_BY_STYLE: Record<PortraitEnhanceStyle, string> = {
  natural: 'portraitEnhanceReasonNatural',
  glamour: 'portraitEnhanceReasonGlamour',
  restore: 'portraitEnhanceReasonRestore',
};

export function resolvePortraitEnhanceRoute(
  profile: ImageContentProfile,
  params: { enhanceStyle?: unknown } = {}
): PortraitEnhanceRouting {
  const enhanceStyle = parseEnhanceStyle(params.enhanceStyle);
  const warningKey = profile.kind !== 'photo' ? 'portraitEnhanceWarnNotPhoto' : undefined;

  return {
    model: getPortraitEnhanceModel(),
    modelLabel: 'CodeFormer portrait enhancer',
    enhanceStyle,
    codeformerFidelity: FIDELITY_BY_STYLE[enhanceStyle],
    faceUpsample: true,
    backgroundEnhance: false,
    reasonKey: REASON_BY_STYLE[enhanceStyle],
    warningKey,
  };
}
