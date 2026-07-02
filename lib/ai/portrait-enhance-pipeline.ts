import { runPortraitEnhancePipeline } from '@/lib/ai/portrait-enhance/pipeline';
import type { PortraitEnhanceRouting } from '@/lib/ai/portrait-enhance-routing';
import { normalizePortraitEnhanceParams } from '@/lib/tools/portrait-enhance-params';

/** @deprecated Import from `@/lib/ai/portrait-enhance` — kept for existing imports. */
export async function enhancePortraitFaces(params: {
  inputBuffer: Buffer;
  userId: string;
  routing: PortraitEnhanceRouting;
  provider: 'replicate' | 'mock';
}): Promise<{
  buffer: Buffer;
  mimeType: string;
  faceCount: number;
  resolvedMode: 'enhance' | 'restore';
  usedRestoreModel: boolean;
}> {
  const normalized = normalizePortraitEnhanceParams({
    mode: params.routing.mode,
    preset: params.routing.preset,
    intensity: params.routing.intensity,
    enhanceStyle: params.routing.enhanceStyle,
  });

  return runPortraitEnhancePipeline({
    inputBuffer: params.inputBuffer,
    userId: params.userId,
    provider: params.provider,
    mode: normalized.mode,
    preset: normalized.preset,
    intensity: normalized.intensity,
    restoreModel: params.routing.restoreModel,
    codeformerFidelity: params.routing.codeformerFidelity,
  });
}
