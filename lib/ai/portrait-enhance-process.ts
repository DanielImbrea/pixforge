import { runPortraitEnhancePipeline } from '@/lib/ai/portrait-enhance/pipeline';
import { normalizePortraitEnhanceParams } from '@/lib/tools/portrait-enhance-params';
import type { PortraitEnhanceParams } from '@/lib/tools/portrait-enhance-params';

export async function applyMockPortraitEnhance(
  inputBuffer: Buffer,
  params: Partial<PortraitEnhanceParams> & { enhanceStyle?: 'natural' | 'glamour' } = {}
): Promise<Buffer> {
  const normalized = normalizePortraitEnhanceParams(params);
  const result = await runPortraitEnhancePipeline({
    inputBuffer,
    userId: 'mock',
    provider: 'mock',
    mode: normalized.mode,
    preset: normalized.preset,
    intensity: normalized.intensity,
    restoreModel: 'sczhou/codeformer',
    codeformerFidelity: 0.88,
  });
  return result.buffer;
}
