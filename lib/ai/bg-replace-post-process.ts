import sharp from 'sharp';
import type { BgReplaceParams } from '@/lib/tools/bg-replace-params';
import {
  getSolidBgReplaceColor,
  isSolidBgReplacePreset,
  resolveBgReplacePrompt,
} from '@/lib/tools/bg-replace-params';
import { generateAiBackgroundPlate } from '@/lib/ai/bg-replace-generate';

async function createSolidPlate(width: number, height: number, hex: string): Promise<Buffer> {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r, g, b },
    },
  })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

async function trimCutoutBounds(cutout: Buffer): Promise<Buffer> {
  try {
    return await sharp(cutout).trim({ threshold: 10 }).png().toBuffer();
  } catch {
    return cutout;
  }
}

async function compositeOnPlate(cutout: Buffer, plate: Buffer): Promise<Buffer> {
  const cutoutMeta = await sharp(cutout).metadata();
  const plateMeta = await sharp(plate).metadata();
  const width = plateMeta.width ?? cutoutMeta.width ?? 1024;
  const height = plateMeta.height ?? cutoutMeta.height ?? 1024;

  const fittedPlate = await sharp(plate)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .toBuffer();

  const subject = await sharp(cutout)
    .resize({
      width: Math.round(width * 0.88),
      height: Math.round(height * 0.88),
      fit: 'inside',
      withoutEnlargement: false,
    })
    .toBuffer();

  return sharp(fittedPlate)
    .composite([{ input: subject, gravity: 'centre' }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

export interface BgReplaceFinalizeResult {
  buffer: Buffer;
  backgroundLabel: string;
  usedAiGeneration: boolean;
}

export async function finalizeBgReplaceOutput(
  cutoutPng: Buffer,
  params: BgReplaceParams
): Promise<BgReplaceFinalizeResult> {
  const trimmed = await trimCutoutBounds(cutoutPng);
  const meta = await sharp(trimmed).metadata();
  const width = Math.max(512, Math.min(meta.width ?? 1024, 2048));
  const height = Math.max(512, Math.min(meta.height ?? 1024, 2048));

  let plate: Buffer;
  let usedAiGeneration = false;
  let backgroundLabel = params.backgroundPreset;

  if (isSolidBgReplacePreset(params.backgroundPreset)) {
    const color = getSolidBgReplaceColor(params.backgroundPreset) ?? '#ffffff';
    plate = await createSolidPlate(width, height, color);
  } else {
    const prompt = resolveBgReplacePrompt(params);
    if (!prompt) {
      throw new Error('Background prompt is required.');
    }
    plate = await generateAiBackgroundPlate(width, height, prompt);
    usedAiGeneration = true;
    backgroundLabel = params.backgroundPreset === 'custom' ? 'custom' : params.backgroundPreset;
  }

  const buffer = await compositeOnPlate(trimmed, plate);

  return {
    buffer,
    backgroundLabel,
    usedAiGeneration,
  };
}
