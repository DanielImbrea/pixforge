import type { ImageJobRow, ToolDefinition } from '@/types';
import type { QualityIntent } from '@/lib/image/quality-intent';

export interface ProcessInput {
  job: ImageJobRow;
  tool: ToolDefinition;
  inputAssetUrl: string;
}

export interface ProcessResult {
  status: 'done' | 'processing' | 'failed';
  outputBuffer?: Buffer;
  outputMimeType?: string;
  outputWidth?: number;
  outputHeight?: number;
  outputSizeBytes?: number;
  outputFormat?: string;
  outputFormatLabel?: string;
  outputEncodeQuality?: number | null;
  backgroundFillApplied?: boolean;
  smartFormatSelected?: boolean;
  contentKind?: string;
  formatReasonKey?: string;
  compressionLevel?: QualityIntent;
  sizeReductionPercent?: number | null;
  inputSizeBytes?: number;
  keptOriginal?: boolean;
  upscaleReasonKey?: string;
  upscaleWarningKey?: string;
  upscaleModelLabel?: string;
  upscaleEffectiveScale?: 2 | 4;
  upscaleSmartMode?: boolean;
  upscaleRouting?: import('@/lib/ai/upscale-routing').UpscaleRouting;
  bgRemovalReasonKey?: string;
  bgRemovalModelLabel?: string;
  bgRemovalSubjectMode?: string;
  bgRemovalEdgeQuality?: string;
  bgRemovalSmartMode?: boolean;
  bgRemovalRouting?: import('@/lib/ai/bg-removal-routing').BgRemovalRouting;
  blurFacesReasonKey?: string;
  blurFacesModelLabel?: string;
  blurFacesRouting?: import('@/lib/ai/blur-faces-routing').BlurFacesRouting;
  blurFacesCount?: number | null;
  providerJobId?: string;
  error?: string;
  errorKey?: string;
}

export interface ToolProcessor {
  process(input: ProcessInput): Promise<ProcessResult>;
}
