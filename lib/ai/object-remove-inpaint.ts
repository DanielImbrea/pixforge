import sharp from 'sharp';
import { resolveObjectRemoveInpaintPrompt } from '@/lib/tools/object-remove-params';
import { getAiProvider, requireReplicateToken } from '@/lib/ai/config';
import { fetchImageBuffer } from '@/lib/ai/fetch-image';
import { resolveReplicateVersion, extractReplicateOutputUrl } from '@/lib/ai/replicate-client';
import type { ReplicatePrediction } from '@/lib/ai/replicate-client';

const REPLICATE_API = 'https://api.replicate.com/v1';

function getObjectRemoveModel(): string {
  return process.env.REPLICATE_OBJECT_REMOVE_MODEL?.trim() || 'black-forest-labs/flux-fill-dev';
}

export async function applyMockObjectRemove(imageBuffer: Buffer, maskBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer).rotate();
  const meta = await image.metadata();
  const width = meta.width ?? 1;
  const height = meta.height ?? 1;

  const maskRaw = await sharp(maskBuffer)
    .rotate()
    .resize(width, height, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer();

  const originalRaw = await image.ensureAlpha().raw().toBuffer();
  const blurredRaw = await sharp(imageBuffer).rotate().blur(18).ensureAlpha().raw().toBuffer();

  const channels = 4;
  const out = Buffer.alloc(originalRaw.length);
  for (let i = 0; i < width * height; i++) {
    const blend = maskRaw[i] > 64 ? 1 : 0;
    const keep = 1 - blend;
    for (let c = 0; c < 3; c++) {
      out[i * channels + c] = Math.round(
        originalRaw[i * channels + c] * keep + blurredRaw[i * channels + c] * blend
      );
    }
    out[i * channels + 3] = 255;
  }

  const format = meta.format === 'png' ? 'png' : 'jpeg';
  const pipeline = sharp(out, { raw: { width, height, channels: 4 } });
  return format === 'png'
    ? pipeline.png({ compressionLevel: 8 }).toBuffer()
    : pipeline.jpeg({ quality: 92, mozjpeg: true }).toBuffer();
}

async function runReplicateInpaint(
  imageUrl: string,
  maskUrl: string,
  prompt: string
): Promise<Buffer> {
  const token = requireReplicateToken();
  const model = getObjectRemoveModel();
  const versionFull = await resolveReplicateVersion(model, token, {
    toolCategory: 'object_remove',
  });
  const versionId = versionFull.includes(':') ? versionFull.split(':')[1] : versionFull;

  const res = await fetch(`${REPLICATE_API}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=120',
    },
    body: JSON.stringify({
      version: versionId,
      input: {
        image: imageUrl,
        mask: maskUrl,
        prompt: prompt || 'seamless natural background, photorealistic',
        output_format: 'jpg',
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Object removal failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const prediction = (await res.json()) as ReplicatePrediction;
  if (prediction.status !== 'succeeded') {
    throw new Error(prediction.error || 'Object removal did not complete.');
  }

  const url = extractReplicateOutputUrl(prediction.output);
  if (!url) {
    throw new Error('Object removal returned no image.');
  }

  const { buffer } = await fetchImageBuffer(url);
  return buffer;
}

export async function runObjectRemoveInpaint(params: {
  imageBuffer: Buffer;
  maskBuffer: Buffer;
  imageUrl?: string;
  maskUrl?: string;
  editMode?: 'remove' | 'replace';
  prompt?: string;
}): Promise<Buffer> {
  if (getAiProvider() === 'mock') {
    return applyMockObjectRemove(params.imageBuffer, params.maskBuffer);
  }

  if (!params.imageUrl || !params.maskUrl) {
    throw new Error('Signed image and mask URLs are required for object removal.');
  }

  const prompt = resolveObjectRemoveInpaintPrompt(params.editMode ?? 'remove', params.prompt);

  try {
    return await runReplicateInpaint(params.imageUrl, params.maskUrl, prompt);
  } catch (err) {
    console.warn('[object-remove] Replicate inpaint failed, using mock fallback', err);
    return applyMockObjectRemove(params.imageBuffer, params.maskBuffer);
  }
}
