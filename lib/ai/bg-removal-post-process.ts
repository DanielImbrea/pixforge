import sharp from 'sharp';
import { applyShadowRecovery } from '@/lib/ai/shadow-recovery';
import type { BgEdgeQuality, BgPostProcessProfile, BgRemovalRouting } from '@/lib/ai/bg-removal-routing';

export interface BgRemovalFinalizeOptions {
  shadowRecovery?: boolean;
  originalBuffer?: Buffer;
}

export interface BgRemovalFinalizeResult {
  buffer: Buffer;
  shadowRecoveryApplied: boolean;
}

function qualityStrength(edgeQuality: BgEdgeQuality): number {
  if (edgeQuality === 'studio') return 1.5;
  if (edgeQuality === 'high') return 1.15;
  return 1;
}

async function removeWhiteFringe(buffer: Buffer, strength: number): Promise<Buffer> {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  if (channels < 4 || data.length === 0) {
    return buffer;
  }

  const next = Buffer.from(data);
  for (let i = 0; i < next.length; i += channels) {
    const r = next[i] ?? 0;
    const g = next[i + 1] ?? 0;
    const b = next[i + 2] ?? 0;
    const a = next[i + 3] ?? 255;

    if (a === 0 || a === 255) continue;

    const brightness = (r + g + b) / 3;
    if (brightness > 210) {
      const reduction = Math.min(a, Math.round((brightness - 200) * 0.35 * strength));
      next[i + 3] = Math.max(0, a - reduction);
    }
  }

  return sharp(next, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toBuffer();
}

export async function applyBgRemovalPostProcess(
  buffer: Buffer,
  routing: Pick<BgRemovalRouting, 'postProcess' | 'edgeQuality' | 'subjectMode'>
): Promise<Buffer> {
  const strength = qualityStrength(routing.edgeQuality);
  let pipeline = sharp(buffer).ensureAlpha();

  if (routing.postProcess === 'product-hard') {
    pipeline = pipeline.sharpen({
      sigma: 0.55 * strength,
      m1: 0.45,
      m2: 0.2,
    });
  } else if (routing.postProcess === 'portrait-soft') {
    if (routing.edgeQuality !== 'standard') {
      pipeline = pipeline.sharpen({
        sigma: 0.3 * strength,
        m1: 0.25,
        m2: 0.12,
      });
    }
  } else if (routing.edgeQuality === 'studio') {
    pipeline = pipeline.sharpen({
      sigma: 0.45 * strength,
      m1: 0.35,
      m2: 0.18,
    });
  }

  let processed = await pipeline.png({ compressionLevel: 6 }).toBuffer();

  if (routing.edgeQuality !== 'standard') {
    processed = await removeWhiteFringe(processed, strength);
  }

  return sharp(processed)
    .ensureAlpha()
    .png({
      compressionLevel: routing.edgeQuality === 'studio' ? 9 : 8,
      adaptiveFiltering: true,
      effort: routing.edgeQuality === 'studio' ? 10 : 8,
    })
    .toBuffer();
}

export async function finalizeBgRemovalOutput(
  cutoutBuffer: Buffer,
  routing: Pick<BgRemovalRouting, 'postProcess' | 'edgeQuality' | 'subjectMode'>,
  options: BgRemovalFinalizeOptions = {}
): Promise<BgRemovalFinalizeResult> {
  let buffer = await applyBgRemovalPostProcess(cutoutBuffer, routing);
  let shadowRecoveryApplied = false;

  if (options.shadowRecovery && options.originalBuffer) {
    buffer = await applyShadowRecovery(options.originalBuffer, buffer);
    shadowRecoveryApplied = true;
  }

  return { buffer, shadowRecoveryApplied };
}
