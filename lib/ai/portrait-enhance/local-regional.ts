import sharp from 'sharp';
import type { PortraitFeatureKey } from '@/lib/ai/portrait-enhance/types';

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

async function enhanceLighting(buffer: Buffer, strength: number): Promise<Buffer> {
  const s = clamp01(strength);
  if (s < 0.02) return buffer;
  return sharp(buffer)
    .modulate({ brightness: 1 + s * 0.028 })
    .gamma(1 + s * 0.02)
    .toBuffer();
}

async function enhanceSkin(buffer: Buffer, strength: number): Promise<Buffer> {
  const s = clamp01(strength);
  if (s < 0.02) return buffer;
  return sharp(buffer)
    .gamma(1 + s * 0.018)
    .sharpen({ sigma: 0.25 + s * 0.35, m1: 0.12, m2: 0.65 })
    .toBuffer();
}

async function enhanceUnderEye(buffer: Buffer, strength: number): Promise<Buffer> {
  const s = clamp01(strength);
  if (s < 0.02) return buffer;
  return sharp(buffer)
    .modulate({ brightness: 1 + s * 0.035 })
    .blur(Math.max(0.3, s * 0.8))
    .sharpen({ sigma: 0.2, m1: 0.1, m2: 0.5 })
    .toBuffer();
}

async function enhanceTeeth(buffer: Buffer, strength: number): Promise<Buffer> {
  const s = clamp01(strength);
  if (s < 0.02) return buffer;
  return sharp(buffer)
    .modulate({ brightness: 1 + s * 0.05, saturation: 0.98 + s * 0.04 })
    .toBuffer();
}

async function enhanceLips(buffer: Buffer, strength: number): Promise<Buffer> {
  const s = clamp01(strength);
  if (s < 0.02) return buffer;
  return sharp(buffer)
    .modulate({ saturation: 1 + s * 0.06, brightness: 1 + s * 0.01 })
    .sharpen({ sigma: 0.3 + s * 0.25, m1: 0.15, m2: 0.7 })
    .toBuffer();
}

async function enhanceEyes(buffer: Buffer, strength: number): Promise<Buffer> {
  const s = clamp01(strength);
  if (s < 0.02) return buffer;
  return sharp(buffer)
    .sharpen({ sigma: 0.45 + s * 0.55, m1: 0.18, m2: 0.95 })
    .modulate({ brightness: 1 + s * 0.012 })
    .toBuffer();
}

const ENHANCERS: Record<
  PortraitFeatureKey,
  (buffer: Buffer, strength: number) => Promise<Buffer>
> = {
  lighting: enhanceLighting,
  skin: enhanceSkin,
  underEye: enhanceUnderEye,
  teeth: enhanceTeeth,
  lips: enhanceLips,
  eyes: enhanceEyes,
};

/** Subtle regional adjustments — always derived from the original crop to preserve identity. */
export async function applyRegionalEnhancement(
  originalCrop: Buffer,
  feature: PortraitFeatureKey,
  strength: number
): Promise<Buffer> {
  return ENHANCERS[feature](originalCrop, strength);
}
