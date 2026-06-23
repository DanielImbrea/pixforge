'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export interface BatchResultItem {
  fileName: string;
  jobId: string;
  previewUrl: string;
  canDownloadHd: boolean;
  status: 'done' | 'failed';
  errorMessage?: string;
}

interface BatchResultsViewProps {
  results: BatchResultItem[];
  hasCommercialLicense: boolean;
  onDownload: (jobId: string) => void;
  onReset: () => void;
}

export function BatchResultsView({
  results,
  hasCommercialLicense,
  onDownload,
  onReset,
}: BatchResultsViewProps) {
  const t = useTranslations('tool');
  const succeeded = results.filter((r) => r.status === 'done').length;

  return (
    <div className="flex flex-col gap-4 p-6">
      <p className="text-sm text-text-secondary">
        {t('batchComplete', { done: succeeded, total: results.length })}
      </p>

      {hasCommercialLicense && (
        <p className="text-xs rounded-md border border-success/30 bg-success/5 px-3 py-2 text-success">
          {t('commercialLicenseBadge')}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {results.map((item) => (
          <div
            key={item.jobId}
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
                <div className="p-3 flex items-center justify-between gap-2">
                  <p className="text-xs text-text-secondary truncate">{item.fileName}</p>
                  <Button variant="secondary" size="sm" onClick={() => onDownload(item.jobId)}>
                    {item.canDownloadHd ? t('downloadHd') : t('downloadFree')}
                  </Button>
                </div>
              </>
            ) : (
              <div className="p-4 text-xs text-danger">
                {item.fileName}: {item.errorMessage || t('errorGeneric')}
              </div>
            )}
          </div>
        ))}
      </div>

      <Button variant="ghost" className="self-start" onClick={onReset}>
        {t('batchProcessAnother')}
      </Button>
    </div>
  );
}
