'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface ResultViewProps {
  previewUrl: string;
  canDownloadHd: boolean;
  hasCommercialLicense?: boolean;
  outputWidth?: number | null;
  outputHeight?: number | null;
  outputSizeBytes?: number | null;
  outputFormatLabel?: string | null;
  smartFormatSelected?: boolean;
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

export function ResultView({
  previewUrl,
  canDownloadHd,
  hasCommercialLicense = false,
  outputWidth,
  outputHeight,
  outputSizeBytes,
  outputFormatLabel,
  smartFormatSelected = false,
  onDownload,
  onUpgradeClick,
  onReset,
}: ResultViewProps) {
  const t = useTranslations('tool');
  const sizeLabel = formatFileSize(outputSizeBytes);
  const dimensionsLabel =
    outputWidth && outputHeight ? `${outputWidth} × ${outputHeight} px` : null;

  return (
    <div className="flex flex-col gap-4">
      {hasCommercialLicense && (
        <p className="text-xs rounded-md border border-success/30 bg-success/5 px-3 py-2 text-success">
          {t('commercialLicenseBadge')}
        </p>
      )}

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

      {(dimensionsLabel || sizeLabel || smartFormatSelected) && (
        <div className="text-xs text-text-tertiary text-center space-y-1">
          {(dimensionsLabel || sizeLabel) && (
            <p>{[dimensionsLabel, sizeLabel].filter(Boolean).join(' · ')}</p>
          )}
          {smartFormatSelected && outputFormatLabel && (
            <p className="text-text-secondary">{t('smartFormatBadge', { format: outputFormatLabel })}</p>
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
