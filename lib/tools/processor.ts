import type { ImageJobRow, ToolDefinition } from '@/types';

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
  smartFormatSelected?: boolean;
  contentKind?: string;
  formatReasonKey?: string;
  sizeReductionPercent?: number | null;
  inputSizeBytes?: number;
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
  providerJobId?: string;
  error?: string;
}

export interface ToolProcessor {
  process(input: ProcessInput): Promise<ProcessResult>;
}
