import sharp from 'sharp';
import { resolveObjectRemoveInpaintPrompt } from '@/lib/tools/object-remove-params';
import { getAiProvider, requireReplicateToken } from '@/lib/ai/config';
import { fetchImageBuffer } from '@/lib/ai/fetch-image';
import { resolveReplicateVersion, extractReplicateOutputUrl, runReplicatePredictionAndWait } from '@/lib/ai/replicate-client';
import { createSignedUrl, deleteFromStorage, uploadBufferToStorage } from '@/lib/supabase/storage';

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

  let prediction;
  try {
    prediction = await runReplicatePredictionAndWait({
      versionId,
      input: {
        image: imageUrl,
        mask: maskUrl,
        prompt: prompt || 'seamless natural background, photorealistic',
        output_format: 'jpg',
      },
      token,
    });
  } catch (err) {
    const status =
      err && typeof err === 'object' && 'httpStatus' in err
        ? (err as { httpStatus: number }).httpStatus
        : 0;
    const message = err instanceof Error ? err.message : 'Object removal failed.';
    throw new Error(`Object removal failed (${status || 'error'}): ${message.slice(0, 200)}`);
  }
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

async function uploadTempForInpaint(
  imageBuffer: Buffer,
  maskBuffer: Buffer,
  userId: string
): Promise<{ imageUrl: string; maskUrl: string; paths: string[] }> {
  const imageUpload = await uploadBufferToStorage(imageBuffer, 'uploads', userId, 'image/jpeg');
  const maskUpload = await uploadBufferToStorage(maskBuffer, 'uploads', userId, 'image/png');
  const [imageUrl, maskUrl] = await Promise.all([
    createSignedUrl('uploads', imageUpload.storagePath, 900),
    createSignedUrl('uploads', maskUpload.storagePath, 900),
  ]);
  return { imageUrl, maskUrl, paths: [imageUpload.storagePath, maskUpload.storagePath] };
}

async function cleanupTempPaths(paths: string[]): Promise<void> {
  await Promise.all(paths.map((path) => deleteFromStorage('uploads', path).catch(() => undefined)));
}

export async function runObjectRemoveInpaint(params: {
  imageBuffer: Buffer;
  maskBuffer: Buffer;
  imageUrl?: string;
  maskUrl?: string;
  userId?: string;
  editMode?: 'remove' | 'replace';
  prompt?: string;
}): Promise<Buffer> {
  if (getAiProvider() === 'mock') {
    return applyMockObjectRemove(params.imageBuffer, params.maskBuffer);
  }

  const prompt = resolveObjectRemoveInpaintPrompt(params.editMode ?? 'remove', params.prompt);
  let imageUrl = params.imageUrl;
  let maskUrl = params.maskUrl;
  let tempPaths: string[] = [];

  if (!imageUrl || !maskUrl) {
    if (!params.userId) {
      throw new Error('Signed image and mask URLs are required for object removal.');
    }
    const temp = await uploadTempForInpaint(params.imageBuffer, params.maskBuffer, params.userId);
    imageUrl = temp.imageUrl;
    maskUrl = temp.maskUrl;
    tempPaths = temp.paths;
  }

  try {
    return await runReplicateInpaint(imageUrl, maskUrl, prompt);
  } catch (err) {
    console.warn('[object-remove] Replicate inpaint failed, using mock fallback', err);
    return applyMockObjectRemove(params.imageBuffer, params.maskBuffer);
  } finally {
    if (tempPaths.length > 0) {
      await cleanupTempPaths(tempPaths);
    }
  }
}
