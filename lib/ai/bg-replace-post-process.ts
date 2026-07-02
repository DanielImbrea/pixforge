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

function getSubjectScale(params: BgReplaceParams): number {
  if (params.subjectMode === 'portrait') return 0.94;
  if (params.subjectMode === 'product') return 0.82;
  if (params.subjectMode === 'object') return 0.86;
  return 0.88;
}

function shouldUseShadow(params: BgReplaceParams): boolean {
  return !isSolidBgReplacePreset(params.backgroundPreset);
}

async function compositeOnPlate(cutout: Buffer, plate: Buffer, params: BgReplaceParams): Promise<Buffer> {
  const cutoutMeta = await sharp(cutout).metadata();
  const plateMeta = await sharp(plate).metadata();
  const width = plateMeta.width ?? cutoutMeta.width ?? 1024;
  const height = plateMeta.height ?? cutoutMeta.height ?? 1024;
  const subjectScale = getSubjectScale(params);

  const fittedPlate = await sharp(plate)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .toBuffer();

  const subject = await sharp(cutout)
    .resize({
      width: Math.round(width * subjectScale),
      height: Math.round(height * subjectScale),
      fit: 'inside',
      withoutEnlargement: false,
    })
    .toBuffer();

  const subjectMeta = await sharp(subject).metadata();
  const subjectWidth = subjectMeta.width ?? Math.round(width * subjectScale);
  const subjectHeight = subjectMeta.height ?? Math.round(height * subjectScale);
  const left = Math.round((width - subjectWidth) / 2);
  const portraitTop = Math.round(Math.max(0, (height - subjectHeight) * 0.38));
  const objectTop = Math.round(Math.max(0, (height - subjectHeight) * 0.48));
  const top = params.subjectMode === 'portrait' ? portraitTop : objectTop;

  const composites: sharp.OverlayOptions[] = [];

  if (shouldUseShadow(params)) {
    const shadow = await sharp(subject)
      .ensureAlpha()
      .linear(0, 0)
      .blur(16)
      .modulate({ brightness: 0.4 })
      .png()
      .toBuffer();

    composites.push({
      input: shadow,
      left,
      top: top + Math.round(Math.max(12, height * 0.018)),
      blend: 'multiply',
      opacity: 0.22,
    });
  }

  composites.push({ input: subject, left, top });

  return sharp(fittedPlate)
    .composite(composites)
    .jpeg({ quality: 94, mozjpeg: true })
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

  const buffer = await compositeOnPlate(trimmed, plate, params);

  return {
    buffer,
    backgroundLabel,
    usedAiGeneration,
  };
}
