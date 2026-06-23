'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface ResultViewProps {
  previewUrl: string;
  canDownloadHd: boolean;
  hasCommercialLicense?: boolean;
  onDownload: () => void;
  onUpgradeClick: () => void;
  onReset: () => void;
}

export function ResultView({
  previewUrl,
  canDownloadHd,
  hasCommercialLicense = false,
  onDownload,
  onUpgradeClick,
  onReset,
}: ResultViewProps) {
  const t = useTranslations('tool');

  return (
    <div className="flex flex-col gap-4">
      {hasCommercialLicense && (
        <p className="text-xs rounded-md border border-success/30 bg-success/5 px-3 py-2 text-success">
          {t('commercialLicenseBadge')}
        </p>
      )}

      <div className="rounded-lg border border-border-default overflow-hidden bg-background-secondary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt={t('result')} className="w-full h-auto max-h-[480px] object-contain" />
      </div>

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
