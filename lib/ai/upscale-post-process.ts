import sharp from 'sharp';
import type { UpscalePostProcess } from '@/lib/ai/upscale-routing';

export async function applyUpscalePostProcess(
  buffer: Buffer,
  postProcess: UpscalePostProcess
): Promise<Buffer> {
  if (postProcess === 'none') {
    return buffer;
  }

  let pipeline = sharp(buffer);

  if (postProcess === 'light-sharpen') {
    pipeline = pipeline.sharpen({ sigma: 0.8, m1: 0.5, m2: 0.25 });
  }

  if (postProcess === 'artifact-soften') {
    pipeline = pipeline.median(3).sharpen({ sigma: 0.45, m1: 0.35, m2: 0.2 });
  }

  const meta = await sharp(buffer).metadata();
  if (meta.format === 'png') {
    return pipeline.png({ compressionLevel: 8 }).toBuffer();
  }
  if (meta.format === 'webp') {
    return pipeline.webp({ quality: 92 }).toBuffer();
  }

  return pipeline.jpeg({ quality: 92, mozjpeg: true }).toBuffer();
}
