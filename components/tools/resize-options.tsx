'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import {
  computeDimensionsForPercent,
  computeLinkedDimension,
  computeProjectedOutputDimensions,
  estimateOutputFileSize,
  ECOMMERCE_RESIZE_PRESETS,
  RESIZE_PERCENT_SCALES,
  SOCIAL_RESIZE_PRESETS,
  applyResizePreset,
  type ResizeParams,
  type ResizePreset,
} from '@/lib/tools/resize-params';
import { formatBytesPrecise } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export type ResizeOptionsValue = ResizeParams;

interface ResizeOptionsProps {
  value: ResizeOptionsValue;
  onChange: (value: ResizeOptionsValue) => void;
  error?: string | null;
  originalDimensions?: { width: number; height: number } | null;
  originalFileSize?: number | null;
  maxQuality?: number;
}

const selectClassName =
  'w-full rounded-md border border-border-default bg-background-primary px-3 py-2 text-sm text-text-primary';

export function ResizeOptions({
  value,
  onChange,
  error,
  originalDimensions,
  originalFileSize,
  maxQuality = 100,
}: ResizeOptionsProps) {
  const t = useTranslations('tool');

  const projected =
    originalDimensions != null
      ? computeProjectedOutputDimensions(
          originalDimensions.width,
          originalDimensions.height,
          value
        )
      : null;

  const estimatedBytes =
    originalDimensions != null &&
    originalFileSize != null &&
    projected != null
      ? estimateOutputFileSize(
          originalFileSize,
          originalDimensions.width,
          originalDimensions.height,
          projected.width,
          projected.height,
          value.quality,
          value.targetFormat
        )
      : null;

  const isUpscaling =
    projected != null &&
    originalDimensions != null &&
    (projected.width > originalDimensions.width ||
      projected.height > originalDimensions.height);

  const showQuality =
    value.targetFormat === 'jpeg' ||
    value.targetFormat === 'webp' ||
    value.targetFormat === 'avif' ||
    value.targetFormat === 'auto' ||
    value.targetFormat === 'original';

  const handleWidthChange = (raw: string) => {
    const width = raw ? Number(raw) : undefined;
    if (value.maintainAspectRatio && originalDimensions && width && width > 0) {
      onChange({
        ...value,
        width,
        height: computeLinkedDimension(
          'width',
          width,
          originalDimensions.width,
          originalDimensions.height
        ),
      });
      return;
    }
    onChange({ ...value, width });
  };

  const handleHeightChange = (raw: string) => {
    const height = raw ? Number(raw) : undefined;
    if (value.maintainAspectRatio && originalDimensions && height && height > 0) {
      onChange({
        ...value,
        height,
        width: computeLinkedDimension(
          'height',
          height,
          originalDimensions.width,
          originalDimensions.height
        ),
      });
      return;
    }
    onChange({ ...value, height });
  };

  const handlePresetClick = (preset: ResizePreset) => {
    onChange(applyResizePreset(value, preset));
  };

  const renderPresetGroup = (titleKey: string, presets: ResizePreset[]) => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-text-primary">{t(titleKey as 'resizePresets')}</label>
      <div className="flex flex-col gap-2">
        {presets.map((preset) => {
          const isActive = value.width === preset.width && value.height === preset.height;
          return (
            <button
              key={preset.id}
              type="button"
              className={cn(
                'rounded-lg border px-3 py-2 text-left text-xs transition-colors',
                isActive
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary'
              )}
              onClick={() => handlePresetClick(preset)}
            >
              <span className="block font-medium">{t(preset.labelKey as 'resizePresetInstagramPost')}</span>
              {preset.hintKey ? (
                <span className="mt-0.5 block text-[11px] opacity-80">
                  {t(preset.hintKey as 'resizePresetAmazonHint')}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {originalDimensions && (
        <div className="rounded-md border border-border-default bg-background-secondary px-3 py-2 text-xs text-text-secondary">
          {t('resizeOriginalDimensions', {
            width: originalDimensions.width,
            height: originalDimensions.height,
          })}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">{t('resizeDimensions')}</label>
        <p className="text-xs text-text-tertiary">{t('resizeDimensionsHint')}</p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-text-tertiary mb-1 block">{t('widthPx')}</label>
            <Input
              type="number"
              min={1}
              max={10000}
              placeholder="1920"
              value={value.width ?? ''}
              onChange={(e) => handleWidthChange(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-text-tertiary mb-1 block">{t('heightPx')}</label>
            <Input
              type="number"
              min={1}
              max={10000}
              placeholder="1080"
              value={value.height ?? ''}
              onChange={(e) => handleHeightChange(e.target.value)}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-border-default"
            checked={value.maintainAspectRatio}
            onChange={(e) => onChange({ ...value, maintainAspectRatio: e.target.checked })}
          />
          {t('resizeMaintainAspectRatio')}
        </label>
      </div>

      {renderPresetGroup('resizeEcommercePresets', ECOMMERCE_RESIZE_PRESETS)}

      {renderPresetGroup('resizePresets', SOCIAL_RESIZE_PRESETS)}

      {originalDimensions && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-primary">{t('resizePercentScale')}</label>
          <div className="flex flex-wrap gap-2">
            {RESIZE_PERCENT_SCALES.map((percent) => (
              <button
                key={percent}
                type="button"
                className="rounded-full border border-border-default px-3 py-1 text-xs text-text-secondary hover:border-border-strong transition-colors"
                onClick={() => {
                  const dims = computeDimensionsForPercent(
                    originalDimensions.width,
                    originalDimensions.height,
                    percent
                  );
                  onChange({ ...value, width: dims.width, height: dims.height });
                }}
              >
                {percent}%
              </button>
            ))}
          </div>
        </div>
      )}

      {originalDimensions && projected && (
        <div className="rounded-md border border-border-default bg-background-secondary px-3 py-2 space-y-1 text-xs">
          <p className="font-medium text-text-primary">{t('resizePreviewTitle')}</p>
          <p className="text-text-secondary">
            {t('resizePreviewOriginal', {
              width: originalDimensions.width,
              height: originalDimensions.height,
            })}
          </p>
          <p className="text-text-primary">
            {t('resizePreviewResult', { width: projected.width, height: projected.height })}
          </p>
          {originalFileSize != null && estimatedBytes != null && (
            <p className="text-text-tertiary pt-1 border-t border-border-default/60">
              {t('resizeSizeEstimate', {
                current: formatBytesPrecise(originalFileSize),
                estimated: formatBytesPrecise(estimatedBytes),
              })}
            </p>
          )}
          {isUpscaling && originalFileSize != null && estimatedBytes != null && estimatedBytes > originalFileSize && (
            <p className="text-[11px] text-text-tertiary">{t('resizeUpscaleSizeNote')}</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">{t('resizeOutputFormat')}</label>
        <select
          className={selectClassName}
          value={value.targetFormat}
          onChange={(e) =>
            onChange({
              ...value,
              targetFormat: e.target.value as ResizeOptionsValue['targetFormat'],
            })
          }
        >
          <option value="original">{t('resizeFormatOriginal')}</option>
          <option value="auto">{t('convertFormatAuto')}</option>
          <option value="jpeg">JPEG</option>
          <option value="png">PNG</option>
          <option value="webp">WebP</option>
          <option value="avif">AVIF</option>
        </select>
      </div>

      {showQuality && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-medium text-text-primary">{t('resizeQuality')}</label>
            <span className="text-xs font-semibold tabular-nums text-text-secondary">{value.quality}%</span>
          </div>
          <p className="text-xs text-text-tertiary">{t('resizeQualityHint')}</p>
          <input
            type="range"
            min={70}
            max={maxQuality}
            step={1}
            value={Math.min(value.quality, maxQuality)}
            onChange={(e) => onChange({ ...value, quality: Number(e.target.value) })}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-[10px] text-text-tertiary">
            <span>70%</span>
            <span>{t('resizeQualityRecommended')}</span>
            <span>{maxQuality}%</span>
          </div>
          {maxQuality < 100 && (
            <p className="text-[11px] text-text-tertiary">{t('resizeQualityPlanLimit')}</p>
          )}
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
