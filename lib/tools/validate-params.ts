import type { ToolDefinition } from '@/types';
import { resizeParamsSchema, upscaleParamsSchema } from '@/lib/validation/schemas';

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
    return { valid: true, params: result.data };
  }

  if (tool.category === 'upscale') {
    const result = upscaleParamsSchema.safeParse(raw);
    if (!result.success) {
      return { valid: false, params: {}, errorKey: 'validationUpscaleInvalid' };
    }
    return { valid: true, params: result.data };
  }

  return { valid: true, params: {} };
}

export function buildToolParams(
  tool: ToolDefinition,
  resizeParams: { width?: number; height?: number },
  upscaleParams: { scale: number }
): Record<string, unknown> {
  if (tool.category === 'resize') {
    return { width: resizeParams.width, height: resizeParams.height };
  }
  if (tool.category === 'upscale') {
    return { scale: upscaleParams.scale };
  }
  return {};
}
