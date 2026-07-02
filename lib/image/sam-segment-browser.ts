'use client';

export { SamSegmentError } from '@/lib/image/sam-segment-error';
export {
  isSamEmbeddingReady,
  isSamModelsReady,
  preloadSamModels,
  prepareSamImage,
  resetSamSession,
  segmentSamAtClick,
  segmentSamAtClickWithAssist,
  undoSamClick,
  clearSamClicks,
  disposeSamWorker,
  type SamClickType,
} from '@/lib/image/sam-worker-host';
