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
  providerJobId?: string;
  error?: string;
}

export interface ToolProcessor {
  process(input: ProcessInput): Promise<ProcessResult>;
}
