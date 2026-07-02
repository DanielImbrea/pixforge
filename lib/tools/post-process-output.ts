import sharp from 'sharp';
import type { ToolCategory, ToolType } from '@/types';

export interface PostProcessOptions {
  jobId?: string;
  toolCategory?: ToolCategory;
  preserveMaxQuality?: boolean;
}

/**
 * Post-AI delivery optimization (Sharp, €0):
 * - Upscale / portrait / bg replace → preserve max quality for paid exports
 * - Background removal → optimized PNG (transparency preserved)
 * Sharp-only tools skip this — their processor already picks the right format.
 */
export async function postProcessOutput(
  buffer: Buffer,
  mimeType: string,
  toolType: ToolType,
  toolCategory: ToolCategory,
  options: PostProcessOptions = {}
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (toolType !== 'ai') {
    return { buffer, mimeType };
  }

  const started = Date.now();

  let result: { buffer: Buffer; mimeType: string };
  const preserveMaxQuality = Boolean(options.preserveMaxQuality);

  if (toolCategory === 'background') {
    const optimized = await sharp(buffer)
      .ensureAlpha()
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();
    result = { buffer: optimized, mimeType: 'image/png' };
  } else if (toolCategory === 'faces') {
    result = { buffer, mimeType };
  } else if (preserveMaxQuality) {
    result = { buffer, mimeType };
  } else {
    const optimized = await sharp(buffer).webp({ quality: 88, effort: 4 }).toBuffer();
    result = { buffer: optimized, mimeType: 'image/webp' };
  }

  const ms = Date.now() - started;
  console.log(
    `[postProcessOutput] job=${options.jobId ?? 'unknown'} category=${toolCategory} ${ms}ms input=${buffer.byteLength}B output=${result.buffer.byteLength}B`
  );

  return result;
}
