import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import type { ToolDefinition, UserRow } from '@/types';
import { maxUploadMbForTool } from '@/lib/billing/entitlements';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

const MAX_PIXELS = 60_000_000; // ~60 megapixels ceiling regardless of plan, guards against decompression bombs

export async function validateUploadBuffer(
  buffer: Buffer,
  declaredMimeType: string,
  user: UserRow,
  tool: ToolDefinition
): Promise<void> {
  const maxMb = maxUploadMbForTool(user, tool);
  const sizeMb = buffer.byteLength / (1024 * 1024);

  if (sizeMb > maxMb) {
    throw new ValidationError(`File exceeds the ${maxMb}MB limit for your plan.`);
  }

  if (!tool.limits.acceptedFormats.includes(declaredMimeType)) {
    throw new ValidationError(`Unsupported format: ${declaredMimeType}`);
  }

  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !tool.limits.acceptedFormats.includes(detected.mime)) {
    throw new ValidationError('File content does not match an accepted image format.');
  }

  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    throw new ValidationError('Unable to read image metadata. The file may be corrupted.');
  }

  if (!metadata.width || !metadata.height) {
    throw new ValidationError('Could not determine image dimensions.');
  }

  if (metadata.width * metadata.height > MAX_PIXELS) {
    throw new ValidationError('Image dimensions are too large to process.');
  }

  const maxDim = tool.limits.maxDimensionPx;
  if (maxDim && (metadata.width > maxDim || metadata.height > maxDim)) {
    throw new ValidationError(`Image dimensions exceed the ${maxDim}px limit for this tool.`);
  }
}

export async function normalizeImageBuffer(buffer: Buffer): Promise<Buffer> {
  // Re-encode through Sharp to strip any embedded scripts/exploits in
  // malformed or polyglot image files before storing or forwarding the
  // bytes anywhere else in the pipeline.
  const metadata = await sharp(buffer).metadata();
  const format = metadata.format;

  if (format === 'png') return sharp(buffer).png().toBuffer();
  if (format === 'webp') return sharp(buffer).webp().toBuffer();
  if (format === 'avif') return sharp(buffer).avif().toBuffer();
  return sharp(buffer).jpeg({ quality: 95 }).toBuffer();
}
