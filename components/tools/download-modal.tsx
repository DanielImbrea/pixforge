'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ChevronDown, Crown, ImageIcon, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DownloadModalContext, DownloadExportSettings, ExportFormat, ExportScalePercent } from '@/lib/tools/download-export/types';
import { EXPORT_SCALE_OPTIONS, FILE_SIZE_LIMIT_OPTIONS_KB } from '@/lib/tools/download-export/types';
import {
  getExportPlanEntitlements,
  isFormatAllowed,
  isProOnlyFeature,
} from '@/lib/tools/download-export/plan-entitlements';
import {
  computeExportDimensions,
  estimateExportSizeBytes,
  formatExportSummaryLabel,
  getExportSizeMode,
  resolveInitialExportSettings,
  saveExportSettings,
  buildExportFilename,
  suggestFormatForTool,
} from '@/lib/tools/download-export/settings';
import { triggerBrowserDownloadPost } from '@/lib/utils/trigger-download';

interface DownloadModalProps {
  open: boolean;
  context: DownloadModalContext | null;
  onClose: () => void;
  onUpgradeClick?: () => void;
}

const ALL_FORMATS: { id: ExportFormat | 'avif' | 'tiff'; label: string; disabled?: boolean }[] = [
  { id: 'png', label: 'PNG' },
  { id: 'jpeg', label: 'JPG' },
  { id: 'webp', label: 'WebP' },
  { id: 'avif', label: 'AVIF', disabled: true },
  { id: 'tiff', label: 'TIFF', disabled: true },
];

function formatOptionLabel(
  scale: ExportScalePercent,
  width: number,
  height: number,
  estimatedBytes: number | null
): string {
  const dims = `${width.toLocaleString()} × ${height.toLocaleString()}`;
  if (!estimatedBytes) return `${scale}% (${dims})`;
  const sizeMb = estimatedBytes / (1024 * 1024);
  const sizeLabel = sizeMb >= 1 ? `~${sizeMb.toFixed(1)} MB` : `~${Math.round(estimatedBytes / 1024)} KB`;
  return `${scale}% (${dims}) · ${sizeLabel}`;
}

export function DownloadModal({ open, context, onClose, onUpgradeClick }: DownloadModalProps) {
  const t = useTranslations('tool');
  const [settings, setSettings] = useState<DownloadExportSettings | null>(null);
  const [formatOpen, setFormatOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = context?.plan ?? 'free';
  const entitlements = getExportPlanEntitlements(plan);
  const sizeMode = context ? getExportSizeMode(context.toolCategory) : 'scalable';

  useEffect(() => {
    if (!open || !context) return;
    setSettings(
      resolveInitialExportSettings({
        plan: context.plan,
        toolCategory: context.toolCategory,
        hasTransparency: context.hasTransparency,
        suggestedFormat: context.suggestedFormat,
      })
    );
    setError(null);
    setFormatOpen(false);
  }, [open, context]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const activeSettings = settings;
  const summary = useMemo(() => {
    if (!context || !activeSettings) return '';
    const { width, height } = computeExportDimensions(
      context.processedWidth,
      context.processedHeight,
      activeSettings.scalePercent,
      sizeMode
    );
    const estimate = estimateExportSizeBytes(
      context.sourceSizeBytes,
      activeSettings.scalePercent,
      activeSettings.format,
      activeSettings.compress && entitlements.compressFile,
      sizeMode
    );
    return formatExportSummaryLabel(activeSettings.format, width, height, estimate);
  }, [context, activeSettings, entitlements.compressFile, sizeMode]);

  const handleExport = useCallback(async () => {
    if (!context || !activeSettings) return;
    setIsExporting(true);
    setError(null);

    const { width, height } = computeExportDimensions(
      context.processedWidth,
      context.processedHeight,
      activeSettings.scalePercent,
      sizeMode
    );

    const body = {
      format: activeSettings.format,
      scalePercent: activeSettings.scalePercent,
      compress: activeSettings.compress && entitlements.compressFile,
      compressLevel: activeSettings.compressLevel,
      limitFileSize: activeSettings.limitFileSize && entitlements.limitFileSize,
      maxFileSizeKb: activeSettings.maxFileSizeKb,
      transparentBackground:
        activeSettings.transparentBackground &&
        entitlements.transparentBackground &&
        activeSettings.format !== 'jpeg',
      stripMetadata: true,
      fileName: context.fileNameBase,
    };

    try {
      await triggerBrowserDownloadPost(
        `/api/assets/${context.jobId}/export`,
        body,
        buildExportFilename(context.fileNameBase, activeSettings.format, width, height)
      );
      saveExportSettings(activeSettings);
      onClose();
    } catch {
      setError(t('downloadModalExportFailed'));
    } finally {
      setIsExporting(false);
    }
  }, [context, activeSettings, entitlements, sizeMode, onClose, t]);

  if (!open || !context || !activeSettings) return null;

  const showTransparentBg =
    context.hasTransparency &&
    (activeSettings.format === 'png' || activeSettings.format === 'webp');

  const formatHint: Record<ExportFormat, string> = {
    png: t('downloadModalFormatHintPng'),
    jpeg: t('downloadModalFormatHintJpeg'),
    webp: t('downloadModalFormatHintWebp'),
  };

  const selectedFormatLabel =
    activeSettings.format === 'jpeg' ? 'JPG' : activeSettings.format.toUpperCase();

  const suggestedFormat = context
    ? context.suggestedFormat ?? suggestFormatForTool(context.toolCategory, context.hasTransparency)
    : 'png';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label={t('downloadModalClose')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-modal-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border-default bg-background-primary shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center gap-2 border-b border-border-default px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-text-secondary hover:bg-background-secondary"
            aria-label={t('downloadModalClose')}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 id="download-modal-title" className="flex-1 text-base font-semibold text-text-primary">
            {t('downloadModalTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-text-secondary hover:bg-background-secondary sm:hidden"
            aria-label={t('downloadModalClose')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 space-y-5">
          <div className="rounded-lg border border-border-default overflow-hidden bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%),linear-gradient(-45deg,#f3f4f6_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f3f4f6_75%),linear-gradient(-45deg,transparent_75%,#f3f4f6_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] bg-background-secondary p-3 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={context.previewUrl}
              alt={t('result')}
              className="max-h-36 w-auto object-contain"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">{t('downloadModalFileType')}</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setFormatOpen((v) => !v)}
                className="flex w-full items-center gap-3 rounded-lg border border-border-default bg-background-primary px-3 py-2.5 text-left text-sm hover:border-border-strong"
              >
                <ImageIcon className="h-4 w-4 shrink-0 text-text-tertiary" />
                <span className="flex-1 font-medium">{selectedFormatLabel}</span>
                {activeSettings.format === suggestedFormat && (
                  <Badge className="shrink-0">{t('downloadModalSuggested')}</Badge>
                )}
                <ChevronDown className="h-4 w-4 shrink-0 text-text-tertiary" />
              </button>
              {formatOpen && (
                <div className="absolute left-0 right-0 z-20 mt-1 rounded-lg border border-border-default bg-background-primary py-1 shadow-lg">
                  {ALL_FORMATS.map((fmt) => {
                    const isExportFmt = fmt.id === 'png' || fmt.id === 'jpeg' || fmt.id === 'webp';
                    const exportFormat = isExportFmt ? (fmt.id as ExportFormat) : null;
                    const locked = exportFormat !== null && !isFormatAllowed(plan, exportFormat);
                    const disabled = fmt.disabled || locked;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          if (!exportFormat || disabled) return;
                          setSettings((s) => (s ? { ...s, format: exportFormat } : s));
                          setFormatOpen(false);
                        }}
                        className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-background-secondary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="min-w-[3rem] font-medium">{fmt.label}</span>
                        {fmt.disabled && (
                          <span className="text-xs text-text-tertiary">{t('downloadModalComingSoon')}</span>
                        )}
                        {locked && !fmt.disabled && (
                          <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
                            <Crown className="h-3 w-3" />
                            {t('downloadModalUpgrade')}
                          </span>
                        )}
                        {exportFormat && !disabled && (
                          <span className="text-xs text-text-tertiary">
                            {formatHint[exportFormat]}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              {sizeMode === 'fixed' ? t('downloadModalExportSize') : t('downloadModalSize')}
            </label>
            {sizeMode === 'fixed' ? (
              <p className="rounded-lg border border-border-default bg-background-secondary px-3 py-2.5 text-sm tabular-nums text-text-primary">
                {context.processedWidth.toLocaleString()} × {context.processedHeight.toLocaleString()} px
              </p>
            ) : (
              <div className="space-y-2">
                {EXPORT_SCALE_OPTIONS.map((scale) => {
                  const locked = scale > entitlements.maxScalePercent;
                  const { width, height } = computeExportDimensions(
                    context.processedWidth,
                    context.processedHeight,
                    scale,
                    sizeMode
                  );
                  const estimate = estimateExportSizeBytes(
                    context.sourceSizeBytes,
                    scale,
                    activeSettings.format,
                    activeSettings.compress && entitlements.compressFile,
                    sizeMode
                  );
                  const selected = activeSettings.scalePercent === scale;
                  return (
                    <button
                      key={scale}
                      type="button"
                      disabled={locked}
                      onClick={() => setSettings((s) => (s ? { ...s, scalePercent: scale } : s))}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                        selected
                          ? 'border-accent bg-accent/5 text-text-primary'
                          : 'border-border-default hover:border-border-strong'
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <span className="tabular-nums">
                        {formatOptionLabel(scale, width, height, estimate)}
                      </span>
                      {locked && (
                        <span className="inline-flex items-center gap-1 text-xs text-text-tertiary shrink-0 ml-2">
                          <Crown className="h-3 w-3" />
                          {t('downloadModalUpgrade')}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {showTransparentBg && (
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={activeSettings.transparentBackground && entitlements.transparentBackground}
                disabled={isProOnlyFeature(plan, 'transparentBackground')}
                onChange={(e) =>
                  setSettings((s) => (s ? { ...s, transparentBackground: e.target.checked } : s))
                }
                className="h-4 w-4 rounded border-border-default accent-accent"
              />
              <span className="flex-1 text-text-primary">{t('downloadModalTransparentBg')}</span>
              {isProOnlyFeature(plan, 'transparentBackground') && (
                <Crown className="h-4 w-4 text-text-tertiary" />
              )}
            </label>
          )}

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={activeSettings.compress && entitlements.compressFile}
              disabled={isProOnlyFeature(plan, 'compressFile')}
              onChange={(e) => setSettings((s) => (s ? { ...s, compress: e.target.checked } : s))}
              className="h-4 w-4 rounded border-border-default accent-accent"
            />
            <span className="flex-1 text-text-primary">{t('downloadModalCompress')}</span>
            {isProOnlyFeature(plan, 'compressFile') && <Crown className="h-4 w-4 text-text-tertiary" />}
          </label>

          {activeSettings.compress && entitlements.compressFile && (
            <div className="ml-7 flex flex-wrap gap-2">
              {(['high', 'balanced', 'smallest'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSettings((s) => (s ? { ...s, compressLevel: level } : s))}
                  className={`rounded-md border px-2.5 py-1 text-xs ${
                    activeSettings.compressLevel === level
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border-default text-text-secondary'
                  }`}
                >
                  {t(`downloadModalCompress_${level}`)}
                </button>
              ))}
            </div>
          )}

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={activeSettings.limitFileSize && entitlements.limitFileSize}
              disabled={isProOnlyFeature(plan, 'limitFileSize')}
              onChange={(e) =>
                setSettings((s) => (s ? { ...s, limitFileSize: e.target.checked } : s))
              }
              className="h-4 w-4 rounded border-border-default accent-accent"
            />
            <span className="flex-1 text-text-primary">{t('downloadModalLimitSize')}</span>
            {isProOnlyFeature(plan, 'limitFileSize') && <Crown className="h-4 w-4 text-text-tertiary" />}
          </label>

          {activeSettings.limitFileSize && entitlements.limitFileSize && (
            <div className="ml-7 flex flex-wrap gap-2">
              {FILE_SIZE_LIMIT_OPTIONS_KB.map((kb) => (
                <button
                  key={kb}
                  type="button"
                  onClick={() => setSettings((s) => (s ? { ...s, maxFileSizeKb: kb } : s))}
                  className={`rounded-md border px-2.5 py-1 text-xs ${
                    activeSettings.maxFileSizeKb === kb
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border-default text-text-secondary'
                  }`}
                >
                  {kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2 border-t border-border-default pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
              {t('downloadModalPreferences')}
            </p>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={activeSettings.rememberSettings}
                onChange={(e) =>
                  setSettings((s) => (s ? { ...s, rememberSettings: e.target.checked } : s))
                }
                className="h-4 w-4 rounded border-border-default accent-accent"
              />
              <span className="text-text-primary">{t('downloadModalRemember')}</span>
            </label>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <div className="border-t border-border-default px-4 py-4 space-y-2">
          <Button
            variant="primary"
            className="w-full"
            disabled={isExporting}
            onClick={() => void handleExport()}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('downloadModalExporting')}
              </>
            ) : (
              t('downloadModalDownload')
            )}
          </Button>
          <p className="text-center text-xs text-text-tertiary tabular-nums">{summary}</p>
          {(isProOnlyFeature(plan, 'transparentBackground') ||
            isProOnlyFeature(plan, 'compressFile') ||
            !isFormatAllowed(plan, 'webp')) && (
            <button
              type="button"
              onClick={onUpgradeClick}
              className="w-full text-center text-xs text-accent hover:underline"
            >
              {t('downloadModalUpgradeCta')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
