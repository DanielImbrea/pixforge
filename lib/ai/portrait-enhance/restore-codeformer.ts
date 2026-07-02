import sharp from 'sharp';
import { requireReplicateToken } from '@/lib/ai/config';
import { fetchImageBuffer } from '@/lib/ai/fetch-image';
import {
  extractReplicateOutputUrl,
  resolveReplicateVersion,
  runReplicatePredictionAndWait,
} from '@/lib/ai/replicate-client';
import { createSignedUrl, deleteFromStorage, uploadBufferToStorage } from '@/lib/supabase/storage';

export interface RestoreModelAdapter {
  readonly id: string;
  enhance(cropBuffer: Buffer, userId: string, fidelity: number): Promise<Buffer>;
}

async function uploadTempImage(buffer: Buffer, userId: string): Promise<{ path: string; signedUrl: string }> {
  const { storagePath } = await uploadBufferToStorage(buffer, 'uploads', userId, 'image/png');
  const signedUrl = await createSignedUrl('uploads', storagePath, 900);
  return { path: storagePath, signedUrl };
}

/** CodeFormer — face restoration for blurry / compressed sources only. */
export class CodeFormerRestoreAdapter implements RestoreModelAdapter {
  readonly id: string;

  constructor(modelId = 'sczhou/codeformer') {
    this.id = modelId;
  }

  async enhance(cropBuffer: Buffer, userId: string, fidelity: number): Promise<Buffer> {
    const token = requireReplicateToken();
    const version = await resolveReplicateVersion(this.id, token, {
      toolCategory: 'portrait_enhance',
    });
    const versionId = version.includes(':') ? version.split(':')[1] : version;
    const temp = await uploadTempImage(cropBuffer, userId);

    try {
      const prediction = await runReplicatePredictionAndWait({
        versionId,
        input: {
          image: temp.signedUrl,
          codeformer_fidelity: fidelity,
          background_enhance: false,
          face_upsample: false,
          upscale: 1,
        },
        token,
        pollTimeoutMs: 45_000,
      });

      if (prediction.status !== 'succeeded') {
        throw new Error(prediction.error || 'Face restoration did not complete.');
      }

      const outputUrl = extractReplicateOutputUrl(prediction.output);
      if (!outputUrl) {
        throw new Error('Face restoration returned no image.');
      }

      const { buffer } = await fetchImageBuffer(outputUrl);
      return buffer;
    } finally {
      await deleteFromStorage('uploads', temp.path).catch(() => undefined);
    }
  }
}

/** Mock restore — mild sharpen only, no generative reconstruction. */
export async function mockRestoreCrop(cropBuffer: Buffer): Promise<Buffer> {
  return sharp(cropBuffer)
    .sharpen({ sigma: 0.9, m1: 0.35, m2: 1.4 })
    .toBuffer();
}

const defaultAdapter = new CodeFormerRestoreAdapter();

export function getRestoreAdapter(modelId?: string): RestoreModelAdapter {
  if (!modelId || modelId.includes('codeformer')) {
    return modelId ? new CodeFormerRestoreAdapter(modelId) : defaultAdapter;
  }
  return new CodeFormerRestoreAdapter(modelId);
}
