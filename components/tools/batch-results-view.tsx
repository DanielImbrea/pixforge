'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { formatBytesPrecise } from '@/lib/utils/format';
import { CompressionStatsRing, computeSavedPercent } from './compression-stats';

export interface BatchResultItem {
  fileName: string;
  jobId: string;
  previewUrl: string;
  canDownloadHd: boolean;
  status: 'done' | 'failed';
  errorMessage?: string;
  inputSizeBytes?: number | null;
  outputSizeBytes?: number | null;
  formatReasonKey?: string | null;
  outputWidth?: number | null;
  outputHeight?: number | null;
}

interface BatchResultsViewProps {
  results: BatchResultItem[];
  hasCommercialLicense: boolean;
  showCompressionStats?: boolean;
  onDownload: (jobId: string) => void;
  onDownloadAll: () => void;
  onReset: () => void;
}

function hasCompressionData(item: BatchResultItem): boolean {
  return (
    item.inputSizeBytes != null &&
    item.inputSizeBytes > 0 &&
    item.outputSizeBytes != null &&
    item.outputSizeBytes > 0
  );
}

export function BatchResultsView({
  results,
  hasCommercialLicense,
  showCompressionStats = false,
  onDownload,
  onDownloadAll,
  onReset,
}: BatchResultsViewProps) {
  const t = useTranslations('tool');
  const succeeded = results.filter((r) => r.status === 'done').length;

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          {t('batchComplete', { done: succeeded, total: results.length })}
        </p>
        {succeeded > 0 && (
          <Button
            variant="primary"
            size="sm"
            className="shrink-0 whitespace-nowrap"
            onClick={onDownloadAll}
          >
            {t('batchDownloadAll', { count: succeeded })}
          </Button>
        )}
      </div>

      {hasCommercialLicense && (
        <p className="text-xs rounded-md border border-success/30 bg-success/5 px-3 py-2 text-success">
          {t('commercialLicenseBadge')}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {results.map((item) => {
          const showStats = showCompressionStats && item.status === 'done' && hasCompressionData(item);
          const savedPercent = showStats
            ? computeSavedPercent(item.inputSizeBytes!, item.outputSizeBytes!)
            : 0;
          const alreadyOptimized = item.formatReasonKey === 'formatReasonAlreadyOptimized';

          return (
            <div
              key={item.jobId || item.fileName}
              className="rounded-lg border border-border-default overflow-hidden bg-background-secondary"
            >
              {item.status === 'done' && item.previewUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.fileName}
                    className="w-full h-40 object-contain bg-background-primary"
                  />
                  <div className="border-t border-border-default bg-background-primary p-3">
                    <div className="flex items-center gap-3">
                      {showStats && (
                        <CompressionStatsRing
                          size="sm"
                          savedPercent={savedPercent}
                          alreadyOptimized={alreadyOptimized}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-text-secondary truncate" title={item.fileName}>
                          {item.fileName}
                        </p>
                        {showStats && (
                          <p className="mt-1 text-[11px] tabular-nums text-text-tertiary">
                            <span>{formatBytesPrecise(item.inputSizeBytes!)}</span>
                            <span className="mx-1.5 text-text-tertiary/70" aria-hidden>
                              →
                            </span>
                            <span className="font-medium text-text-secondary">
                              {formatBytesPrecise(item.outputSizeBytes!)}
                            </span>
                          </p>
                        )}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="shrink-0 whitespace-nowrap self-center"
                        onClick={() => onDownload(item.jobId)}
                      >
                        {t('downloadModalDownload')}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 text-xs text-danger">
                  {item.fileName}: {item.errorMessage || t('errorGeneric')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button variant="ghost" className="self-start" onClick={onReset}>
        {t('batchProcessAnother')}
      </Button>
    </div>
  );
}
