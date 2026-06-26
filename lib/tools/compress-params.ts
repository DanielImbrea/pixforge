import type { QualityIntent } from '@/lib/image/quality-intent';

export interface CompressParams {
  qualityIntent: QualityIntent;
}

export const DEFAULT_COMPRESS_PARAMS: CompressParams = {
  qualityIntent: 'balanced',
};
