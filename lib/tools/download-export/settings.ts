import type { ToolCategory } from '@/types';
import type {
  DownloadExportSettings,
  ExportFormat,
  ExportSizeMode,
} from '@/lib/tools/download-export/types';
import {
  EXPORT_SCALE_DEFAULT,
  EXPORT_SCALE_MAX,
  EXPORT_SCALE_MIN,
} from '@/lib/tools/download-export/types';
import {
  clampScaleMultiplierForPlan,
  getExportPlanEntitlements,
  isFormatAllowed,
} from '@/lib/tools/download-export/plan-entitlements';
import type { PlanTier } from '@/types';

const STORAGE_KEY = 'pixique-download-settings-v2';

export const DEFAULT_EXPORT_SETTINGS: DownloadExportSettings = {
  format: 'png',
  scaleMultiplier: EXPORT_SCALE_DEFAULT,
  compress: false,
  compressLevel: 'balanced',
  limitFileSize: false,
  maxFileSizeKb: 1024,
  transparentBackground: true,
  rememberSettings: true,
};

/** All tools scale from the processed result dimensions (1x = processed output). */
export function getExportSizeMode(_category: ToolCategory): ExportSizeMode {
  return 'scalable';
}

export function computeExportDimensions(
  processedWidth: number,
  processedHeight: number,
  scaleMultiplier: number,
  sizeMode: ExportSizeMode
): { width: number; height: number } {
  if (sizeMode === 'fixed') {
    return { width: processedWidth, height: processedHeight };
  }
  const factor = Math.min(EXPORT_SCALE_MAX, Math.max(EXPORT_SCALE_MIN, scaleMultiplier));
  return {
    width: Math.max(1, Math.round(processedWidth * factor)),
    height: Math.max(1, Math.round(processedHeight * factor)),
  };
}

export function formatScaleMultiplierLabel(multiplier: number): string {
  const rounded = Math.round(multiplier * 1000) / 1000;
  if (rounded === 1) return '1x';
  if (rounded % 1 === 0) return `${rounded}x`;
  return `${rounded}x`;
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
  switch (category) {
    case 'background':
    case 'portrait_enhance':
    case 'upscale':
      return 'png';
    case 'resize':
    case 'compress':
      return 'jpeg';
    case 'convert':
      return 'webp';
    case 'object_remove':
      return hasTransparency ? 'png' : 'jpeg';
    default:
      if (hasTransparency) return 'png';
      return 'jpeg';
  }
}

function migrateLegacySettings(
  parsed: Partial<DownloadExportSettings> & { scalePercent?: number }
): Partial<DownloadExportSettings> {
  if (typeof parsed.scaleMultiplier === 'number') return parsed;
  if (typeof parsed.scalePercent === 'number') {
    return { ...parsed, scaleMultiplier: parsed.scalePercent / 100 };
  }
  return parsed;
}

export function loadSavedExportSettings(): Partial<DownloadExportSettings> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = migrateLegacySettings(
      JSON.parse(raw) as Partial<DownloadExportSettings> & { scalePercent?: number }
    );
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

  merged.scaleMultiplier = clampScaleMultiplierForPlan(params.plan, merged.scaleMultiplier);

  if (!params.hasTransparency) {
    merged.transparentBackground = false;
  }

  if (!getExportPlanEntitlements(params.plan).compressFile) {
    merged.compress = false;
  }
  if (!getExportPlanEntitlements(params.plan).limitFileSize) {
    merged.limitFileSize = false;
  }

  return merged;
}

export function estimateExportSizeBytes(
  sourceSizeBytes: number | null | undefined,
  scaleMultiplier: number,
  format: ExportFormat,
  compress: boolean,
  sizeMode: ExportSizeMode
): number | null {
  if (!sourceSizeBytes || sourceSizeBytes <= 0) return null;

  const pixelFactor = sizeMode === 'fixed' ? 1 : scaleMultiplier ** 2;
  const formatFactor: Record<ExportFormat, number> = {
    png: 1,
    jpeg: 0.38,
    webp: 0.32,
  };

  let estimate = sourceSizeBytes * pixelFactor * formatFactor[format];
  if (compress) estimate *= 0.72;
  return Math.max(2048, Math.round(estimate));
}

export function formatEstimatedSize(estimatedBytes: number | null): string {
  if (!estimatedBytes) return '—';
  const sizeMb = estimatedBytes / (1024 * 1024);
  if (sizeMb >= 1) return `~${sizeMb.toFixed(1)} MB`;
  return `~${Math.round(estimatedBytes / 1024)} KB`;
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
