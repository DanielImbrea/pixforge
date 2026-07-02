'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Check, ChevronDown, ImageIcon, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProBadge } from '@/components/ui/pro-badge';
import { PremiumUpgradeModal } from '@/components/billing/premium-upgrade-modal';
import { ExportSizeSlider } from '@/components/tools/export-size-slider';
import type { DownloadModalContext, DownloadExportSettings, ExportFormat } from '@/lib/tools/download-export/types';
import { FILE_SIZE_LIMIT_PRESETS_KB } from '@/lib/tools/download-export/types';
import {
  getExportPlanEntitlements,
  isFormatAllowed,
  isPremiumExportFeature,
} from '@/lib/tools/download-export/plan-entitlements';
import {
  computeExportDimensions,
  estimateExportSizeBytes,
  formatEstimatedSize,
  getExportSizeMode,
  resolveInitialExportSettings,
  saveExportSettings,
  buildExportFilename,
  suggestFormatForTool,
} from '@/lib/tools/download-export/settings';
import { triggerBrowserDownloadPost } from '@/lib/utils/trigger-download';
import { cn } from '@/lib/utils/cn';

interface DownloadModalProps {
  open: boolean;
  context: DownloadModalContext | null;
  onClose: () => void;
}

type FormatOption = {
  id: ExportFormat | 'pdf' | 'svg' | 'avif';
  label: string;
  hintKey: string;
  disabled?: boolean;
  comingSoon?: boolean;
};

const FORMAT_OPTIONS: FormatOption[] = [
  { id: 'png', label: 'PNG', hintKey: 'downloadModalFormatHintPng' },
  { id: 'jpeg', label: 'JPEG', hintKey: 'downloadModalFormatHintJpeg' },
  { id: 'webp', label: 'WEBP', hintKey: 'downloadModalFormatHintWebp' },
  { id: 'pdf', label: 'PDF', hintKey: 'downloadModalFormatHintPdf', disabled: true, comingSoon: true },
  { id: 'svg', label: 'SVG', hintKey: 'downloadModalFormatHintSvg', disabled: true, comingSoon: true },
  { id: 'avif', label: 'AVIF', hintKey: 'downloadModalFormatHintAvif', disabled: true, comingSoon: true },
];

function PremiumCheckboxRow({
  checked,
  label,
  locked,
  onToggle,
  onPremiumClick,
}: {
  checked: boolean;
  label: string;
  locked: boolean;
  onToggle: (next: boolean) => void;
  onPremiumClick: () => void;
}) {
  const t = useTranslations('tool');

  const handleChange = () => {
    if (locked) {
      onPremiumClick();
      return;
    }
    onToggle(!checked);
  };

  return (
    <div className="group flex items-start gap-3 text-sm">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked && !locked}
        onClick={handleChange}
        className={cn(
          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
          checked && !locked
            ? 'border-accent bg-accent text-white'
            : 'border-border-strong bg-background-primary group-hover:border-accent/50'
        )}
      >
        {checked && !locked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </button>
      <button
        type="button"
        onClick={handleChange}
        className="flex-1 text-left text-text-primary leading-snug"
        title={locked ? t('downloadProBadgeHover') : undefined}
      >
        {label}
      </button>
      {locked ? <ProBadge onClick={onPremiumClick} /> : null}
    </div>
  );
}

export function DownloadModal({ open, context, onClose }: DownloadModalProps) {
  const t = useTranslations('tool');
  const [settings, setSettings] = useState<DownloadExportSettings | null>(null);
  const [formatOpen, setFormatOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [customSizeKb, setCustomSizeKb] = useState('');

  const plan = context?.plan ?? 'free';
  const entitlements = getExportPlanEntitlements(plan);
  const sizeMode = context ? getExportSizeMode(context.toolCategory) : 'scalable';
  const scaleLocked = isPremiumExportFeature(plan, 'scaleSlider');
  const transparentLocked = isPremiumExportFeature(plan, 'transparentBackground');
  const compressLocked = isPremiumExportFeature(plan, 'compressFile');
  const limitSizeLocked = isPremiumExportFeature(plan, 'limitFileSize');

  const openPremium = useCallback(() => setPremiumOpen(true), []);

  useEffect(() => {
    if (!open || !context) return;
    const initial = resolveInitialExportSettings({
      plan: context.plan,
      toolCategory: context.toolCategory,
      hasTransparency: context.hasTransparency,
      suggestedFormat: context.suggestedFormat,
    });
    setSettings(initial);
    setCustomSizeKb(String(initial.maxFileSizeKb));
    setError(null);
    setFormatOpen(false);
    setPremiumOpen(false);
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

  const suggestedFormat = context
    ? context.suggestedFormat ?? suggestFormatForTool(context.toolCategory, context.hasTransparency)
    : 'png';

  const exportDims = useMemo(() => {
    if (!context || !activeSettings) return { width: 0, height: 0 };
    return computeExportDimensions(
      context.processedWidth,
      context.processedHeight,
      scaleLocked ? 1 : activeSettings.scaleMultiplier,
      sizeMode
    );
  }, [context, activeSettings, scaleLocked, sizeMode]);

  const estimatedBytes = useMemo(() => {
    if (!context || !activeSettings) return null;
    return estimateExportSizeBytes(
      context.sourceSizeBytes,
      scaleLocked ? 1 : activeSettings.scaleMultiplier,
      activeSettings.format,
      activeSettings.compress && entitlements.compressFile,
      sizeMode
    );
  }, [context, activeSettings, scaleLocked, entitlements.compressFile, sizeMode]);

  const handleExport = useCallback(async () => {
    if (!context || !activeSettings) return;
    setIsExporting(true);
    setError(null);

    const { width, height } = exportDims;
    const maxFileSizeKb = activeSettings.limitFileSize
      ? Math.min(10240, Math.max(50, Number(customSizeKb) || activeSettings.maxFileSizeKb))
      : activeSettings.maxFileSizeKb;

    const body = {
      format: activeSettings.format,
      scaleMultiplier: scaleLocked ? 1 : activeSettings.scaleMultiplier,
      compress: activeSettings.compress && entitlements.compressFile,
      compressLevel: 'balanced' as const,
      limitFileSize: activeSettings.limitFileSize && entitlements.limitFileSize,
      maxFileSizeKb,
      transparentBackground:
        activeSettings.transparentBackground &&
        entitlements.transparentBackground &&
        activeSettings.format !== 'jpeg' &&
        context.hasTransparency,
      stripMetadata: true,
      fileName: context.fileNameBase,
    };

    try {
      await triggerBrowserDownloadPost(
        `/api/assets/${context.jobId}/export`,
        body,
        buildExportFilename(context.fileNameBase, activeSettings.format, width, height)
      );
      saveExportSettings({ ...activeSettings, maxFileSizeKb });
      onClose();
    } catch {
      setError(t('downloadModalExportFailed'));
    } finally {
      setIsExporting(false);
    }
  }, [
    context,
    activeSettings,
    exportDims,
    customSizeKb,
    scaleLocked,
    entitlements,
    onClose,
    t,
  ]);

  if (!open || !context || !activeSettings) return null;

  const selectedFormatLabel =
    activeSettings.format === 'jpeg' ? 'JPEG' : activeSettings.format.toUpperCase();

  const formatSupportsTransparency =
    activeSettings.format === 'png' || activeSettings.format === 'webp';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <button
          type="button"
          className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
          aria-label={t('downloadModalClose')}
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="download-modal-title"
          className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border-default bg-background-primary shadow-2xl sm:rounded-2xl"
        >
          <div className="flex items-center gap-2 border-b border-border-default px-4 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-secondary hover:bg-background-secondary transition-colors"
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
              className="rounded-lg p-1.5 text-text-secondary hover:bg-background-secondary sm:hidden"
              aria-label={t('downloadModalClose')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-y-auto px-4 py-5 space-y-6">
            <div className="rounded-xl border border-border-default overflow-hidden bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%),linear-gradient(-45deg,#f3f4f6_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f3f4f6_75%),linear-gradient(-45deg,transparent_75%,#f3f4f6_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] bg-background-secondary p-4 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={context.previewUrl}
                alt={t('result')}
                className="max-h-32 w-auto object-contain drop-shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">{t('downloadModalFileType')}</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFormatOpen((v) => !v)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border-default bg-background-primary px-3.5 py-3 text-left text-sm hover:border-border-strong transition-colors"
                >
                  <ImageIcon className="h-4 w-4 shrink-0 text-text-tertiary" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-text-primary">{selectedFormatLabel}</span>
                    {activeSettings.format === suggestedFormat && (
                      <span className="ml-2 text-xs font-medium text-accent">
                        {t('downloadModalSuggested')}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-text-tertiary transition-transform',
                      formatOpen && 'rotate-180'
                    )}
                  />
                </button>
                {formatOpen && (
                  <div className="absolute left-0 right-0 z-20 mt-1.5 overflow-hidden rounded-xl border border-border-default bg-background-primary py-1 shadow-lg">
                    {FORMAT_OPTIONS.map((fmt) => {
                      const isExportFmt =
                        fmt.id === 'png' || fmt.id === 'jpeg' || fmt.id === 'webp';
                      const exportFormat = isExportFmt ? (fmt.id as ExportFormat) : null;
                      const planLocked = exportFormat !== null && !isFormatAllowed(plan, exportFormat);
                      const disabled = fmt.disabled || planLocked;
                      const isSvg = fmt.id === 'svg';
                      const svgDisabled = isSvg && !context.isVector;

                      return (
                        <button
                          key={fmt.id}
                          type="button"
                          disabled={disabled || svgDisabled}
                          onClick={() => {
                            if (!exportFormat || disabled || svgDisabled) return;
                            setSettings((s) => (s ? { ...s, format: exportFormat } : s));
                            setFormatOpen(false);
                          }}
                          className="flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left hover:bg-background-secondary disabled:cursor-not-allowed disabled:opacity-45 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary">{fmt.label}</span>
                            {exportFormat === suggestedFormat && !disabled && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-accent">
                                {t('downloadModalSuggested')}
                              </span>
                            )}
                            {fmt.comingSoon && (
                              <span className="text-[10px] text-text-tertiary">{t('downloadModalComingSoon')}</span>
                            )}
                            {planLocked && !fmt.comingSoon && <ProBadge onClick={openPremium} />}
                          </div>
                          <span className="text-xs text-text-tertiary">{t(fmt.hintKey as 'downloadModalFormatHintPng')}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <ExportSizeSlider
              multiplier={activeSettings.scaleMultiplier}
              processedWidth={context.processedWidth}
              processedHeight={context.processedHeight}
              exportWidth={exportDims.width}
              exportHeight={exportDims.height}
              estimatedBytes={estimatedBytes}
              locked={scaleLocked}
              onMultiplierChange={(value) =>
                setSettings((s) => (s ? { ...s, scaleMultiplier: value } : s))
              }
              onLockedInteraction={openPremium}
            />

            <div className="space-y-3 border-t border-border-default pt-4">
              <PremiumCheckboxRow
                checked={activeSettings.transparentBackground && formatSupportsTransparency}
                label={t('downloadModalTransparentBg')}
                locked={transparentLocked}
                onToggle={(next) =>
                  setSettings((s) => (s ? { ...s, transparentBackground: next } : s))
                }
                onPremiumClick={openPremium}
              />
              {!context.hasTransparency && (
                <p className="text-xs text-text-tertiary pl-7">{t('downloadModalTransparentBgHint')}</p>
              )}

              <PremiumCheckboxRow
                checked={activeSettings.compress}
                label={t('downloadModalCompress')}
                locked={compressLocked}
                onToggle={(next) => setSettings((s) => (s ? { ...s, compress: next } : s))}
                onPremiumClick={openPremium}
              />

              <PremiumCheckboxRow
                checked={activeSettings.limitFileSize}
                label={t('downloadModalLimitSize')}
                locked={limitSizeLocked}
                onToggle={(next) => setSettings((s) => (s ? { ...s, limitFileSize: next } : s))}
                onPremiumClick={openPremium}
              />

              {activeSettings.limitFileSize && !limitSizeLocked && (
                <div className="pl-7 space-y-2">
                  <p className="text-xs font-medium text-text-secondary">{t('downloadModalTargetSize')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {FILE_SIZE_LIMIT_PRESETS_KB.map((kb) => (
                      <button
                        key={kb}
                        type="button"
                        onClick={() => {
                          setSettings((s) => (s ? { ...s, maxFileSizeKb: kb } : s));
                          setCustomSizeKb(String(kb));
                        }}
                        className={cn(
                          'rounded-lg border px-2.5 py-1 text-xs transition-colors',
                          activeSettings.maxFileSizeKb === kb && customSizeKb === String(kb)
                            ? 'border-accent bg-accent/10 text-accent font-medium'
                            : 'border-border-default text-text-secondary hover:border-border-strong'
                        )}
                      >
                        {kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={50}
                      max={10240}
                      value={customSizeKb}
                      onChange={(e) => {
                        setCustomSizeKb(e.target.value);
                        const parsed = Number(e.target.value);
                        if (parsed >= 50 && parsed <= 10240) {
                          setSettings((s) => (s ? { ...s, maxFileSizeKb: parsed } : s));
                        }
                      }}
                      className="h-9 text-sm tabular-nums"
                      placeholder={t('downloadModalCustomSizePlaceholder')}
                    />
                    <span className="text-xs text-text-tertiary shrink-0">KB</span>
                  </div>
                </div>
              )}
            </div>

            <label className="flex items-center gap-3 text-sm border-t border-border-default pt-4">
              <input
                type="checkbox"
                checked={activeSettings.rememberSettings}
                onChange={(e) =>
                  setSettings((s) => (s ? { ...s, rememberSettings: e.target.checked } : s))
                }
                className="h-4 w-4 rounded border-border-default accent-accent"
              />
              <span className="text-text-secondary">{t('downloadModalRemember')}</span>
            </label>

            {error && <p className="text-sm text-danger">{error}</p>}
          </div>

          <div className="border-t border-border-default px-4 py-4 space-y-3 bg-background-primary">
            <Button
              variant="primary"
              className="w-full h-11 text-base"
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

            <div className="rounded-lg bg-background-secondary/80 px-3 py-2.5 text-center space-y-0.5">
              <p className="text-sm font-medium text-text-primary">
                {selectedFormatLabel}
              </p>
              <p className="text-sm tabular-nums text-text-secondary">
                {exportDims.width.toLocaleString()} × {exportDims.height.toLocaleString()} px
              </p>
              <p className="text-xs text-text-tertiary">
                {t('downloadModalEstimatedSize')}:{' '}
                <span className="font-medium text-text-secondary tabular-nums">
                  {formatEstimatedSize(estimatedBytes)}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <PremiumUpgradeModal open={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </>
  );
}
