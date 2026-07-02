import type { ToolCategory } from '@/types';
import type {
  DownloadExportSettings,
  ExportFormat,
  ExportScalePercent,
  ExportSizeMode,
} from '@/lib/tools/download-export/types';
import {
  clampScaleForPlan,
  getExportPlanEntitlements,
  isFormatAllowed,
} from '@/lib/tools/download-export/plan-entitlements';
import type { PlanTier } from '@/types';

const STORAGE_KEY = 'pixique-download-settings-v1';

export const DEFAULT_EXPORT_SETTINGS: DownloadExportSettings = {
  format: 'png',
  scalePercent: 100,
  compress: false,
  compressLevel: 'balanced',
  limitFileSize: false,
  maxFileSizeKb: 1024,
  transparentBackground: true,
  rememberSettings: true,
};

export function getExportSizeMode(category: ToolCategory): ExportSizeMode {
  return category === 'resize' ? 'fixed' : 'scalable';
}

export function computeExportDimensions(
  processedWidth: number,
  processedHeight: number,
  scalePercent: ExportScalePercent,
  sizeMode: ExportSizeMode
): { width: number; height: number } {
  if (sizeMode === 'fixed') {
    return { width: processedWidth, height: processedHeight };
  }
  const factor = scalePercent / 100;
  return {
    width: Math.max(1, Math.round(processedWidth * factor)),
    height: Math.max(1, Math.round(processedHeight * factor)),
  };
}

export function inferHasTransparency(
  toolCategory: ToolCategory,
  outputFormatLabel?: string | null
): boolean {
  if (toolCategory === 'background') return true;
  const fmt = outputFormatLabel?.toLowerCase();
  return fmt === 'png' || fmt === 'webp';
}

export function suggestFormatForTool(
  category: ToolCategory,
  hasTransparency: boolean
): ExportFormat {
  if (category === 'background' || (hasTransparency && category !== 'object_remove')) {
    return 'png';
  }
  if (category === 'compress' || category === 'convert') {
    return 'webp';
  }
  return 'jpeg';
}

export function loadSavedExportSettings(): Partial<DownloadExportSettings> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DownloadExportSettings>;
    if (!parsed.rememberSettings) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveExportSettings(settings: DownloadExportSettings): void {
  if (typeof window === 'undefined' || !settings.rememberSettings) {
    if (typeof window !== 'undefined' && !settings.rememberSettings) {
      localStorage.removeItem(STORAGE_KEY);
    }
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function resolveInitialExportSettings(params: {
  plan: PlanTier;
  toolCategory: ToolCategory;
  hasTransparency: boolean;
  suggestedFormat?: ExportFormat | null;
}): DownloadExportSettings {
  const saved = loadSavedExportSettings();
  const suggested =
    params.suggestedFormat ?? suggestFormatForTool(params.toolCategory, params.hasTransparency);

  const merged: DownloadExportSettings = {
    ...DEFAULT_EXPORT_SETTINGS,
    format: suggested,
    ...saved,
  };

  if (!isFormatAllowed(params.plan, merged.format)) {
    merged.format = getExportPlanEntitlements(params.plan).formats[0] ?? suggested;
  }

  merged.scalePercent = clampScaleForPlan(params.plan, merged.scalePercent);

  if (!params.hasTransparency) {
    merged.transparentBackground = false;
  }

  return merged;
}

export function estimateExportSizeBytes(
  sourceSizeBytes: number | null | undefined,
  scalePercent: ExportScalePercent,
  format: ExportFormat,
  compress: boolean,
  sizeMode: ExportSizeMode
): number | null {
  if (!sourceSizeBytes || sourceSizeBytes <= 0) return null;

  const pixelFactor = sizeMode === 'fixed' ? 1 : (scalePercent / 100) ** 2;
  const formatFactor: Record<ExportFormat, number> = {
    png: 1,
    jpeg: 0.38,
    webp: 0.32,
  };

  let estimate = sourceSizeBytes * pixelFactor * formatFactor[format];
  if (compress) estimate *= 0.72;
  return Math.max(2048, Math.round(estimate));
}

export function formatExportSummaryLabel(
  format: ExportFormat,
  width: number,
  height: number,
  estimatedBytes: number | null
): string {
  const formatLabel = format === 'jpeg' ? 'JPG' : format.toUpperCase();
  const dims = `${width.toLocaleString()} × ${height.toLocaleString()}`;
  if (!estimatedBytes) return `${formatLabel} • ${dims}`;
  const sizeMb = estimatedBytes / (1024 * 1024);
  const sizeLabel = sizeMb >= 1 ? `~${sizeMb.toFixed(1)} MB` : `~${Math.round(estimatedBytes / 1024)} KB`;
  return `${formatLabel} • ${dims} • ${sizeLabel}`;
}

export function buildExportFilename(
  baseName: string | undefined,
  format: ExportFormat,
  width: number,
  height: number
): string {
  const ext = format === 'jpeg' ? 'jpg' : format;
  const stem = (baseName || 'pixiqueai-export')
    .replace(/\.[^.]+$/, '')
    .replace(/[^\w.-]+/g, '-')
    .slice(0, 80);
  return `${stem}-${width}x${height}.${ext}`;
}
