import type { PlanTier } from '@/types';
import type { ToolCategory } from '@/types';

export type ExportFormat = 'png' | 'jpeg' | 'webp';
export type ExportScalePercent = 25 | 50 | 75 | 100;
export type ExportCompressLevel = 'high' | 'balanced' | 'smallest';
export type ExportSizeMode = 'scalable' | 'fixed';

export interface ExportPlanEntitlements {
  formats: ExportFormat[];
  maxScalePercent: ExportScalePercent;
  transparentBackground: boolean;
  compressFile: boolean;
  limitFileSize: boolean;
}

export interface DownloadExportSettings {
  format: ExportFormat;
  scalePercent: ExportScalePercent;
  compress: boolean;
  compressLevel: ExportCompressLevel;
  limitFileSize: boolean;
  maxFileSizeKb: number;
  transparentBackground: boolean;
  rememberSettings: boolean;
}

export interface DownloadModalContext {
  jobId: string;
  previewUrl: string;
  toolCategory: ToolCategory;
  plan: PlanTier;
  processedWidth: number;
  processedHeight: number;
  originalWidth?: number | null;
  originalHeight?: number | null;
  sourceSizeBytes?: number | null;
  hasTransparency: boolean;
  suggestedFormat?: ExportFormat | null;
  fileNameBase?: string;
}

export const EXPORT_SCALE_OPTIONS: ExportScalePercent[] = [25, 50, 75, 100];

export const FILE_SIZE_LIMIT_OPTIONS_KB = [250, 500, 1024, 2048, 5120] as const;
