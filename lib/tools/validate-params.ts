import type { ToolDefinition } from '@/types';
import {
  convertParamsSchema,
  bgRemovalParamsSchema,
  bgReplaceParamsSchema,
  objectRemoveParamsSchema,
  portraitEnhanceParamsSchema,
  resizeParamsSchema,
  upscaleParamsSchema,
  cropParamsSchema,
  blurFacesParamsSchema,
} from '@/lib/validation/schemas';
import { DEFAULT_BG_REMOVAL_PARAMS, type BgRemovalParams } from '@/lib/tools/bg-removal-params';
import { DEFAULT_BG_REPLACE_PARAMS, type BgReplaceParams } from '@/lib/tools/bg-replace-params';
import {
  DEFAULT_OBJECT_REMOVE_PARAMS,
  type ObjectRemoveParams,
} from '@/lib/tools/object-remove-params';
import {
  DEFAULT_PORTRAIT_ENHANCE_PARAMS,
  type PortraitEnhanceParams,
} from '@/lib/tools/portrait-enhance-params';
import { DEFAULT_BLUR_FACES_PARAMS, type BlurFacesParams } from '@/lib/tools/blur-faces-params';
import { DEFAULT_COMPRESS_PARAMS, type CompressParams } from '@/lib/tools/compress-params';
import { DEFAULT_CONVERT_PARAMS, type ConvertParams } from '@/lib/tools/convert-params';
import { DEFAULT_CROP_PARAMS, type CropParams } from '@/lib/tools/crop-params';
import { DEFAULT_RESIZE_PARAMS, type ResizeParams } from '@/lib/tools/resize-params';
import { DEFAULT_UPSCALE_PARAMS, type UpscaleParams } from '@/lib/tools/upscale-params';

export interface ToolParamsValidation {
  valid: boolean;
  params: Record<string, unknown>;
  errorKey?: string;
}

export interface ValidateToolParamsOptions {
  /** Client-side upload includes reference portrait before server assigns referenceAssetId. */
  referenceFilePresent?: boolean;
  /** Client-side upload includes brush mask before server assigns maskAssetId. */
  maskFilePresent?: boolean;
}

export function validateToolParams(
  tool: ToolDefinition,
  raw: Record<string, unknown>,
  options: ValidateToolParamsOptions = {}
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

  if (tool.category === 'crop') {
    const result = cropParamsSchema.safeParse(raw);
    if (!result.success) {
      return { valid: false, params: {}, errorKey: 'validationCropInvalid' };
    }
    if (result.data.width < 1 || result.data.height < 1) {
      return { valid: false, params: {}, errorKey: 'validationCropRequired' };
    }
    return { valid: true, params: result.data };
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

  if (tool.category === 'background_replace') {
    const result = bgReplaceParamsSchema.safeParse(raw);
    if (!result.success) {
      return { valid: false, params: {}, errorKey: 'validationBgReplaceInvalid' };
    }
    if (result.data.backgroundPreset === 'custom' && !result.data.backgroundPrompt.trim()) {
      return { valid: false, params: {}, errorKey: 'validationBgReplacePromptRequired' };
    }
    return { valid: true, params: result.data };
  }

  if (tool.category === 'object_remove') {
    const result = objectRemoveParamsSchema.safeParse(raw);
    if (!result.success) {
      return { valid: false, params: {}, errorKey: 'validationObjectRemoveInvalid' };
    }
    if (!result.data.maskAssetId && !options.maskFilePresent) {
      return { valid: false, params: {}, errorKey: 'validationObjectRemoveMaskRequired' };
    }
    if (result.data.editMode === 'replace' && !result.data.inpaintPrompt.trim()) {
      return { valid: false, params: {}, errorKey: 'validationObjectRemoveReplacePromptRequired' };
    }
    return { valid: true, params: result.data };
  }

  if (tool.category === 'portrait_enhance') {
    const result = portraitEnhanceParamsSchema.safeParse(raw);
    if (!result.success) {
      return { valid: false, params: {}, errorKey: 'validationPortraitEnhanceInvalid' };
    }
    return { valid: true, params: result.data };
  }

  if (tool.category === 'faces') {
    const result = blurFacesParamsSchema.safeParse(raw);
    if (!result.success) {
      return { valid: false, params: {}, errorKey: 'validationBlurFacesInvalid' };
    }
    if (result.data.detectionMode === 'custom') {
      if (!result.data.referenceAssetId && !options.referenceFilePresent) {
        return { valid: false, params: {}, errorKey: 'validationBlurFacesReferenceRequired' };
      }
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
  compressParams: CompressParams = DEFAULT_COMPRESS_PARAMS,
  cropParams: CropParams = DEFAULT_CROP_PARAMS,
  blurFacesParams: BlurFacesParams = DEFAULT_BLUR_FACES_PARAMS,
  bgReplaceParams: BgReplaceParams = DEFAULT_BG_REPLACE_PARAMS,
  objectRemoveParams: ObjectRemoveParams = DEFAULT_OBJECT_REMOVE_PARAMS,
  portraitEnhanceParams: PortraitEnhanceParams = DEFAULT_PORTRAIT_ENHANCE_PARAMS
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
  if (tool.category === 'crop') {
    return {
      left: cropParams.left,
      top: cropParams.top,
      width: cropParams.width,
      height: cropParams.height,
      aspectRatio: cropParams.aspectRatio,
      rotate: cropParams.rotate,
      flipHorizontal: cropParams.flipHorizontal,
      flipVertical: cropParams.flipVertical,
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
  if (tool.category === 'background_replace') {
    return {
      subjectMode: bgReplaceParams.subjectMode,
      edgeQuality: bgReplaceParams.edgeQuality,
      backgroundPreset: bgReplaceParams.backgroundPreset,
      backgroundPrompt: bgReplaceParams.backgroundPrompt,
    };
  }
  if (tool.category === 'object_remove') {
    return {
      brushSize: objectRemoveParams.brushSize,
      editMode: objectRemoveParams.editMode,
      selectionTool: objectRemoveParams.selectionTool,
      inpaintPrompt: objectRemoveParams.inpaintPrompt,
      ...(objectRemoveParams.maskAssetId ? { maskAssetId: objectRemoveParams.maskAssetId } : {}),
    };
  }
  if (tool.category === 'portrait_enhance') {
    return { enhanceStyle: portraitEnhanceParams.enhanceStyle };
  }
  if (tool.category === 'faces') {
    return {
      detectionMode: blurFacesParams.detectionMode,
      blurStrength: blurFacesParams.blurStrength,
      customAction: blurFacesParams.customAction,
      ...(blurFacesParams.referenceAssetId
        ? { referenceAssetId: blurFacesParams.referenceAssetId }
        : {}),
    };
  }
  return {};
}
