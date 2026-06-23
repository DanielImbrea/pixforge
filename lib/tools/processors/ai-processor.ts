import { getAiProvider } from '@/lib/ai/config';
import { submitMockJob } from '@/lib/ai/mock-provider';
import { submitReplicateJob } from '@/lib/ai/replicate-client';
import type { ProcessInput, ToolProcessor } from '../processor';

export { applyMockAiTransform } from '@/lib/ai/mock-provider';
export { fetchAsBuffer } from '@/lib/ai/fetch-image';

export const aiProcessor: ToolProcessor = {
  async process({ job, tool, inputAssetUrl }: ProcessInput) {
    const provider = getAiProvider();

    if (provider === 'replicate') {
      return submitReplicateJob(job, tool, inputAssetUrl);
    }

    return submitMockJob(job, tool, inputAssetUrl);
  },
};
