import type { ToolDefinition } from '@/types';
import { convertParamsSchema, bgRemovalParamsSchema, resizeParamsSchema, upscaleParamsSchema } from '@/lib/validation/schemas';
import { DEFAULT_BG_REMOVAL_PARAMS, type BgRemovalParams } from '@/lib/tools/bg-removal-params';
import { DEFAULT_COMPRESS_PARAMS, type CompressParams } from '@/lib/tools/compress-params';
import { DEFAULT_CONVERT_PARAMS, type ConvertParams } from '@/lib/tools/convert-params';
import { DEFAULT_RESIZE_PARAMS, type ResizeParams } from '@/lib/tools/resize-params';
import { DEFAULT_UPSCALE_PARAMS, type UpscaleParams } from '@/lib/tools/upscale-params';

export interface ToolParamsValidation {
  valid: boolean;
  params: Record<string, unknown>;
  errorKey?: string;
}

export function validateToolParams(
  tool: ToolDefinition,
  raw: Record<string, unknown>
): ToolParamsValidation {
  if (tool.category === 'resize') {
    const result = resizeParamsSchema.safeParse(raw);
    if (!result.success) {
      return { valid: false, params: {}, errorKey: 'validationResizeInvalid' };
    }
    if (!result.data.width && !result.data.height) {
      return { valid: false, params: {}, errorKey: 'validationResizeRequired' };
    }
    const targetFormat = result.data.targetFormat === 'jpg' ? 'jpeg' : result.data.targetFormat;
    return {
      valid: true,
      params: {
        width: result.data.width,
        height: result.data.height,
        maintainAspectRatio: result.data.maintainAspectRatio ?? true,
        targetFormat,
        quality: result.data.quality,
      },
    };
  }

  if (tool.category === 'upscale') {
    const result = upscaleParamsSchema.safeParse(raw);
    if (!result.success) {
      return { valid: false, params: {}, errorKey: 'validationUpscaleInvalid' };
    }
    return { valid: true, params: result.data };
  }

  if (tool.category === 'compress') {
    const qualityIntent = raw.qualityIntent;
    if (qualityIntent !== 'fast' && qualityIntent !== 'balanced' && qualityIntent !== 'max') {
      return { valid: false, params: {}, errorKey: 'validationCompressInvalid' };
    }
    return { valid: true, params: { qualityIntent } };
  }

  if (tool.category === 'convert') {
    const result = convertParamsSchema.safeParse(raw);
    if (!result.success) {
      return { valid: false, params: {}, errorKey: 'validationConvertInvalid' };
    }
    const targetFormat = result.data.targetFormat === 'jpg' ? 'jpeg' : result.data.targetFormat;
    return {
      valid: true,
      params: {
        targetFormat,
        qualityIntent: result.data.qualityIntent,
        backgroundFill: result.data.backgroundFill,
      },
    };
  }

  if (tool.category === 'background') {
    const result = bgRemovalParamsSchema.safeParse(raw);
    if (!result.success) {
      return { valid: false, params: {}, errorKey: 'validationBgRemovalInvalid' };
    }
    return { valid: true, params: result.data };
  }

  return { valid: true, params: {} };
}

export function buildToolParams(
  tool: ToolDefinition,
  resizeParams: ResizeParams = DEFAULT_RESIZE_PARAMS,
  upscaleParams: UpscaleParams = DEFAULT_UPSCALE_PARAMS,
  convertParams: ConvertParams = DEFAULT_CONVERT_PARAMS,
  bgRemovalParams: BgRemovalParams = DEFAULT_BG_REMOVAL_PARAMS,
  compressParams: CompressParams = DEFAULT_COMPRESS_PARAMS
): Record<string, unknown> {
  if (tool.category === 'resize') {
    return {
      width: resizeParams.width,
      height: resizeParams.height,
      maintainAspectRatio: resizeParams.maintainAspectRatio,
      targetFormat: resizeParams.targetFormat,
      quality: resizeParams.quality,
    };
  }
  if (tool.category === 'upscale') {
    return { scale: upscaleParams.scale };
  }
  if (tool.category === 'compress') {
    return { qualityIntent: compressParams.qualityIntent };
  }
  if (tool.category === 'convert') {
    return {
      targetFormat: convertParams.targetFormat,
      qualityIntent: convertParams.qualityIntent,
      backgroundFill: convertParams.backgroundFill,
    };
  }
  if (tool.category === 'background') {
    return {
      subjectMode: bgRemovalParams.subjectMode,
      edgeQuality: bgRemovalParams.edgeQuality,
      shadowRecovery: bgRemovalParams.shadowRecovery,
    };
  }
  return {};
}
