'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { CompressionStats, computeSavedPercent } from './compression-stats';
import { UpscaleResultCompare } from './upscale-result-compare';

interface ResultViewProps {
  previewUrl: string;
  canDownloadHd: boolean;
  hasCommercialLicense?: boolean;
  outputWidth?: number | null;
  outputHeight?: number | null;
  outputSizeBytes?: number | null;
  inputSizeBytes?: number | null;
  outputFormatLabel?: string | null;
  smartFormatSelected?: boolean;
  formatReasonKey?: string | null;
  sizeReductionPercent?: number | null;
  contentKind?: string | null;
  backgroundFillApplied?: boolean;
  upscaleReasonKey?: string | null;
  upscaleWarningKey?: string | null;
  upscaleModelLabel?: string | null;
  upscaleEffectiveScale?: 2 | 4 | null;
  upscaleSmartMode?: boolean;
  bgRemovalReasonKey?: string | null;
  bgRemovalModelLabel?: string | null;
  bgRemovalSubjectMode?: string | null;
  bgRemovalEdgeQuality?: string | null;
  bgRemovalSmartMode?: boolean;
  bgRemovalShadowRecoveryApplied?: boolean;
  sizeCompareOutputLabel?: 'compressed' | 'result';
  beforePreviewUrl?: string | null;
  inputWidth?: number | null;
  inputHeight?: number | null;
  onDownload: () => void;
  onUpgradeClick: () => void;
  onReset: () => void;
}

function formatFileSize(bytes: number | null | undefined): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveInputBytes(
  inputSizeBytes: number | null | undefined,
  outputSizeBytes: number | null | undefined,
  sizeReductionPercent: number | null | undefined
): number | null {
  if (inputSizeBytes && inputSizeBytes > 0) return inputSizeBytes;
  if (
    outputSizeBytes &&
    outputSizeBytes > 0 &&
    sizeReductionPercent &&
    sizeReductionPercent > 0 &&
    sizeReductionPercent < 100
  ) {
    return Math.round(outputSizeBytes / (1 - sizeReductionPercent / 100));
  }
  return null;
}

export function ResultView({
  previewUrl,
  canDownloadHd,
  hasCommercialLicense = false,
  outputWidth,
  outputHeight,
  outputSizeBytes,
  inputSizeBytes,
  outputFormatLabel,
  smartFormatSelected = false,
  formatReasonKey,
  sizeReductionPercent,
  contentKind,
  backgroundFillApplied = false,
  upscaleReasonKey,
  upscaleWarningKey,
  upscaleModelLabel,
  upscaleEffectiveScale,
  upscaleSmartMode = false,
  bgRemovalReasonKey,
  bgRemovalModelLabel,
  bgRemovalEdgeQuality,
  bgRemovalSmartMode = false,
  bgRemovalShadowRecoveryApplied = false,
  sizeCompareOutputLabel = 'compressed',
  beforePreviewUrl,
  inputWidth,
  inputHeight,
  onDownload,
  onUpgradeClick,
  onReset,
}: ResultViewProps) {
  const t = useTranslations('tool');
  const sizeLabel = formatFileSize(outputSizeBytes);
  const dimensionsLabel =
    outputWidth && outputHeight ? `${outputWidth} × ${outputHeight} px` : null;
  const resolvedInputBytes = resolveInputBytes(inputSizeBytes, outputSizeBytes, sizeReductionPercent);
  const isCompressOrConvertResult =
    Boolean(outputFormatLabel || formatReasonKey || smartFormatSelected) &&
    !upscaleReasonKey &&
    !bgRemovalReasonKey;
  const showCompressionStats =
    isCompressOrConvertResult &&
    outputSizeBytes != null &&
    outputSizeBytes > 0 &&
    resolvedInputBytes != null &&
    resolvedInputBytes > 0;
  const savedPercent = computeSavedPercent(resolvedInputBytes ?? 0, outputSizeBytes ?? 0);
  const alreadyOptimized = formatReasonKey === 'formatReasonAlreadyOptimized';
  const showUpscaleCompare = Boolean(upscaleReasonKey && beforePreviewUrl);

  return (
    <div className="flex flex-col gap-4">
      {hasCommercialLicense && (
        <p className="text-xs rounded-md border border-success/30 bg-success/5 px-3 py-2 text-success">
          {t('commercialLicenseBadge')}
        </p>
      )}

      {showUpscaleCompare ? (
        <UpscaleResultCompare
          beforeSrc={beforePreviewUrl!}
          afterSrc={previewUrl}
          beforeWidth={inputWidth}
          beforeHeight={inputHeight}
          afterWidth={outputWidth}
          afterHeight={outputHeight}
        />
      ) : (
        <div className="rounded-lg border border-border-default overflow-hidden bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%),linear-gradient(-45deg,#f3f4f6_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f3f4f6_75%),linear-gradient(-45deg,transparent_75%,#f3f4f6_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] bg-background-secondary p-4 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={t('result')}
            width={outputWidth ?? undefined}
            height={outputHeight ?? undefined}
            className="h-auto max-h-[70vh] object-contain"
            style={
              outputWidth
                ? { maxWidth: `min(100%, ${outputWidth}px)`, width: 'auto', height: 'auto' }
                : { maxWidth: '100%', width: 'auto', height: 'auto' }
            }
          />
        </div>
      )}

      {showCompressionStats && (
        <CompressionStats
          savedPercent={savedPercent}
          alreadyOptimized={alreadyOptimized}
          inputBytes={resolvedInputBytes!}
          outputBytes={outputSizeBytes!}
          outputLabel={sizeCompareOutputLabel}
        />
      )}

      {(dimensionsLabel || sizeLabel || outputFormatLabel || upscaleReasonKey || bgRemovalReasonKey) && (
        <div className="text-xs text-text-tertiary text-center space-y-2">
          {(dimensionsLabel || sizeLabel) && (
            <p>{[dimensionsLabel, sizeLabel].filter(Boolean).join(' · ')}</p>
          )}
          {outputFormatLabel && (formatReasonKey || smartFormatSelected) && (
            <div className="rounded-md border border-border-default bg-background-secondary px-3 py-2 text-left space-y-1">
              {smartFormatSelected && (
                <p className="text-[11px] font-medium text-accent">
                  {t('smartFormatBadge', { format: outputFormatLabel })}
                </p>
              )}
              <p className="font-medium text-text-primary">
                {smartFormatSelected
                  ? t('convertDecisionTitle', { format: outputFormatLabel })
                  : t('formatSelected', { format: outputFormatLabel })}
              </p>
              {contentKind && (
                <p className="text-text-tertiary">
                  {t(`convertContentKind_${contentKind}` as 'convertContentKind_photo')}
                </p>
              )}
              {formatReasonKey && (
                <p className="text-text-secondary">{t(formatReasonKey as 'formatReasonPhotoAvif')}</p>
              )}
              {backgroundFillApplied && (
                <p className="text-text-secondary">{t('convertBackgroundApplied')}</p>
              )}
            </div>
          )}
          {upscaleReasonKey && (
            <div className="rounded-md border border-border-default bg-background-secondary px-3 py-2 text-left space-y-1">
              <p className="font-medium text-text-primary">
                {upscaleEffectiveScale
                  ? t('upscaleSelected', {
                      scale: upscaleEffectiveScale,
                      model: upscaleModelLabel || 'AI',
                    })
                  : t('upscaleEnhanced')}
              </p>
              <p className="text-text-secondary">{t(upscaleReasonKey as 'upscaleReasonPhotoDetail')}</p>
              {upscaleWarningKey && (
                <p className="text-warning">{t(upscaleWarningKey as 'upscaleWarnScreenshot4x')}</p>
              )}
            </div>
          )}
          {bgRemovalReasonKey && (
            <div className="rounded-md border border-border-default bg-background-secondary px-3 py-2 text-left space-y-1">
              <p className="font-medium text-text-primary">
                {bgRemovalModelLabel
                  ? t('bgRemovalSelected', { model: bgRemovalModelLabel })
                  : t('bgRemovalComplete')}
              </p>
              {bgRemovalSmartMode && (
                <p className="text-text-secondary">{t('bgRemovalSmartBadge')}</p>
              )}
              <p className="text-text-secondary">{t(bgRemovalReasonKey as 'bgReasonProductCutout')}</p>
              {bgRemovalEdgeQuality && (
                <p className="text-text-tertiary">
                  {t('bgEdgeQualityApplied', { quality: t(`bgEdgeQualityLabel_${bgRemovalEdgeQuality}` as 'bgEdgeQualityLabel_high') })}
                </p>
              )}
              {bgRemovalShadowRecoveryApplied && (
                <p className="text-text-secondary">{t('bgShadowRecoveryApplied')}</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        {canDownloadHd ? (
          <Button variant="primary" onClick={onDownload}>
            {t('downloadHd')}
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onDownload}>
              {t('downloadFree')}
            </Button>
            <Button variant="primary" onClick={onUpgradeClick}>
              {t('upgradeForHd')}
            </Button>
          </>
        )}
        <Button variant="ghost" onClick={onReset}>
          ↺
        </Button>
      </div>
    </div>
  );
}
