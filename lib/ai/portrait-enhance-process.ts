import sharp from 'sharp';
import type { PortraitEnhanceStyle } from '@/lib/tools/portrait-enhance-params';

export async function applyMockPortraitEnhance(
  buffer: Buffer,
  style: PortraitEnhanceStyle
): Promise<Buffer> {
  const meta = await sharp(buffer).rotate().metadata();
  let pipeline = sharp(buffer).rotate();

  if (style === 'glamour') {
    pipeline = pipeline
      .modulate({ saturation: 1.1, brightness: 1.04 })
      .sharpen({ sigma: 1.15, m1: 0.5, m2: 2.5 });
  } else if (style === 'restore') {
    pipeline = pipeline
      .median(3)
      .sharpen({ sigma: 0.95, m1: 0.4, m2: 2 })
      .modulate({ brightness: 1.03, saturation: 1.02 });
  } else {
    pipeline = pipeline
      .sharpen({ sigma: 0.75, m1: 0.35, m2: 1.8 })
      .modulate({ brightness: 1.015, saturation: 1.03 });
  }

  if (meta.format === 'png') {
    return pipeline.png({ compressionLevel: 8 }).toBuffer();
  }
  if (meta.format === 'webp') {
    return pipeline.webp({ quality: 92 }).toBuffer();
  }
  return pipeline.jpeg({ quality: 92, mozjpeg: true }).toBuffer();
}
