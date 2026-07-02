import sharp from 'sharp';
import type { ExportCompressLevel, ExportFormat } from '@/lib/tools/download-export/types';
import {
  dynamicJpegPhotoQuality,
  dynamicWebpPhotoQuality,
} from '@/lib/image/sharp-encode';

export interface ProcessExportOptions {
  format: ExportFormat;
  width: number;
  height: number;
  transparentBackground: boolean;
  compress: boolean;
  compressLevel: ExportCompressLevel;
  limitFileSize: boolean;
  maxFileSizeKb: number;
  stripMetadata?: boolean;
}

function compressQuality(level: ExportCompressLevel, format: ExportFormat, w: number, h: number): number {
  const baseJpeg = dynamicJpegPhotoQuality(w, h);
  const baseWebp = dynamicWebpPhotoQuality(w, h);
  const factor =
    level === 'high' ? 1 : level === 'balanced' ? 0.82 : 0.65;
  if (format === 'webp') return Math.max(40, Math.round(baseWebp * factor));
  if (format === 'jpeg') return Math.max(45, Math.round(baseJpeg * factor));
  return 9;
}

async function encodeBuffer(
  pipeline: sharp.Sharp,
  format: ExportFormat,
  quality: number
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (format === 'png') {
    const buffer = await pipeline
      .png({ compressionLevel: Math.min(9, Math.max(6, quality)), adaptiveFiltering: true })
      .toBuffer();
    return { buffer, mimeType: 'image/png' };
  }
  if (format === 'webp') {
    const buffer = await pipeline.webp({ quality, effort: 5 }).toBuffer();
    return { buffer, mimeType: 'image/webp' };
  }
  const buffer = await pipeline.jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:2:0' }).toBuffer();
  return { buffer, mimeType: 'image/jpeg' };
}

export async function processExportImage(
  source: Buffer,
  options: ProcessExportOptions
): Promise<{ buffer: Buffer; mimeType: string }> {
  const hasAlpha = await sharp(source).metadata().then((m) => m.hasAlpha);

  let pipeline = sharp(source).rotate();
  if (options.stripMetadata !== false) {
    pipeline = pipeline.withMetadata({ exif: undefined, icc: undefined });
  }

  pipeline = pipeline.resize(options.width, options.height, {
    fit: 'fill',
    kernel: sharp.kernel.lanczos3,
    withoutEnlargement: true,
  });

  if (options.format === 'jpeg' || (!options.transparentBackground && hasAlpha)) {
    pipeline = pipeline.flatten({ background: { r: 255, g: 255, b: 255 } });
  }

  const quality = compressQuality(
    options.compress ? options.compressLevel : 'high',
    options.format,
    options.width,
    options.height
  );

  let result = await encodeBuffer(pipeline, options.format, quality);

  if (options.limitFileSize && options.maxFileSizeKb > 0) {
    const maxBytes = options.maxFileSizeKb * 1024;
    if (result.buffer.length > maxBytes && options.format !== 'png') {
      let low = 30;
      let high = quality;
      for (let i = 0; i < 8 && low <= high; i++) {
        const mid = Math.round((low + high) / 2);
        const attempt = await encodeBuffer(
          sharp(source)
            .rotate()
            .resize(options.width, options.height, { fit: 'fill', withoutEnlargement: true })
            .flatten(options.format === 'jpeg' ? { background: { r: 255, g: 255, b: 255 } } : undefined),
          options.format,
          mid
        );
        if (attempt.buffer.length <= maxBytes) {
          result = attempt;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
    }
  }

  return result;
}
