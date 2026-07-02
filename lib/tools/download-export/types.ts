import type { PlanTier } from '@/types';
import type { ToolCategory } from '@/types';

export type ExportFormat = 'png' | 'jpeg' | 'webp';
export type ExportCompressLevel = 'balanced';
export type ExportSizeMode = 'scalable' | 'fixed';

export const EXPORT_SCALE_MIN = 0.5;
export const EXPORT_SCALE_MAX = 3.125;
export const EXPORT_SCALE_DEFAULT = 1;

export interface ExportPlanEntitlements {
  formats: ExportFormat[];
  canUseScaleSlider: boolean;
  transparentBackground: boolean;
  compressFile: boolean;
  limitFileSize: boolean;
}

export interface DownloadExportSettings {
  format: ExportFormat;
  scaleMultiplier: number;
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
  isVector?: boolean;
}

export const FILE_SIZE_LIMIT_PRESETS_KB = [100, 250, 500, 1024, 2048] as const;
