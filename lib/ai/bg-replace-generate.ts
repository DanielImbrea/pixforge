import sharp from 'sharp';
import { getAiProvider, requireReplicateToken } from '@/lib/ai/config';
import { fetchImageBuffer } from '@/lib/ai/fetch-image';
import { resolveReplicateVersion, extractReplicateOutputUrl, runReplicatePredictionAndWait } from '@/lib/ai/replicate-client';
import { parseModelSlug } from '@/lib/ai/replicate-models';

function getBgReplaceModel(): string {
  return process.env.REPLICATE_BG_REPLACE_MODEL?.trim() || 'black-forest-labs/flux-schnell';
}

function aspectRatioForSize(width: number, height: number): string {
  const ratio = width / height;
  if (ratio > 1.4) return '16:9';
  if (ratio < 0.72) return '9:16';
  return '1:1';
}

async function createMockGradientPlate(width: number, height: number, prompt: string): Promise<Buffer> {
  const hash = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue},45%,22%);stop-opacity:1" />
          <stop offset="100%" style="stop-color:hsl(${(hue + 60) % 360},55%,38%);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`;

  return sharp(Buffer.from(svg)).resize(width, height, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer();
}

async function runReplicateFluxPlate(
  width: number,
  height: number,
  prompt: string
): Promise<Buffer> {
  const token = requireReplicateToken();
  const model = getBgReplaceModel();
  parseModelSlug(model);

  const versionFull = await resolveReplicateVersion(model, token, {});
  const versionId = versionFull.includes(':') ? versionFull.split(':')[1] : versionFull;

  const prediction = await runReplicatePredictionAndWait({
    versionId,
    input: {
      prompt: `${prompt}, premium commercial background plate, realistic studio-grade lighting, clean depth separation, natural color harmony, no people, no text, no watermark, no logo, no extra product, no framing border`,
      aspect_ratio: aspectRatioForSize(width, height),
      output_format: 'jpg',
      output_quality: 92,
    },
    token,
  });
  if (prediction.status !== 'succeeded') {
    throw new Error(prediction.error || 'Background generation did not complete.');
  }

  const url = extractReplicateOutputUrl(prediction.output);
  if (!url) {
    throw new Error('Background generation returned no image.');
  }

  const { buffer } = await fetchImageBuffer(url);
  return buffer;
}

export async function generateAiBackgroundPlate(
  width: number,
  height: number,
  prompt: string
): Promise<Buffer> {
  if (getAiProvider() === 'mock') {
    return createMockGradientPlate(width, height, prompt);
  }

  try {
    return await runReplicateFluxPlate(width, height, prompt);
  } catch (err) {
    console.warn('[bg-replace] AI plate failed, using gradient fallback', err);
    return createMockGradientPlate(width, height, prompt);
  }
}
