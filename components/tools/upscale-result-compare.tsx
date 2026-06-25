'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BeforeAfterSlider } from '@/components/marketplace/before-after-slider';
import { cn } from '@/lib/utils/cn';

type CompareMode = 'slider' | 'before' | 'after' | 'split';

interface UpscaleResultCompareProps {
  beforeSrc: string;
  afterSrc: string;
  beforeWidth?: number | null;
  beforeHeight?: number | null;
  afterWidth?: number | null;
  afterHeight?: number | null;
}

const PREVIEW_CLASS =
  'relative rounded-lg border border-border-default overflow-hidden bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%),linear-gradient(-45deg,#f3f4f6_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f3f4f6_75%),linear-gradient(-45deg,transparent_75%,#f3f4f6_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] bg-background-secondary flex items-center justify-center p-2 min-h-[200px]';

function formatDimensions(width?: number | null, height?: number | null): string | null {
  if (!width || !height) return null;
  return `${width} × ${height} px`;
}

function getCompareDisplaySize(
  afterWidth?: number | null,
  afterHeight?: number | null,
  beforeWidth?: number | null,
  beforeHeight?: number | null
): { width: number; height: number } | null {
  const width = afterWidth || beforeWidth;
  const height = afterHeight || beforeHeight;
  if (!width || !height) return null;
  return { width, height };
}

export function UpscaleResultCompare({
  beforeSrc,
  afterSrc,
  beforeWidth,
  beforeHeight,
  afterWidth,
  afterHeight,
}: UpscaleResultCompareProps) {
  const t = useTranslations('tool');
  const [mode, setMode] = useState<CompareMode>('slider');

  const beforeDims = formatDimensions(beforeWidth, beforeHeight);
  const afterDims = formatDimensions(afterWidth, afterHeight);
  const dimensionSummary =
    beforeDims && afterDims ? t('upscaleCompareDimensions', { before: beforeDims, after: afterDims }) : null;

  const modes: { id: CompareMode; labelKey: 'upscaleCompareBefore' | 'upscaleCompareAfter' | 'upscaleCompareSlider' | 'upscaleCompareSplit' }[] = [
    { id: 'slider', labelKey: 'upscaleCompareSlider' },
    { id: 'split', labelKey: 'upscaleCompareSplit' },
    { id: 'before', labelKey: 'upscaleCompareBefore' },
    { id: 'after', labelKey: 'upscaleCompareAfter' },
  ];

  const displaySize = getCompareDisplaySize(afterWidth, afterHeight, beforeWidth, beforeHeight);
  const imageDisplayStyle = displaySize
    ? {
        width: '100%',
        maxWidth: `min(100%, ${displaySize.width}px)`,
        maxHeight: 'min(70vh, 900px)',
        aspectRatio: `${displaySize.width} / ${displaySize.height}`,
      }
    : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              mode === item.id
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary'
            )}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      {dimensionSummary && (
        <p className="text-center text-xs text-text-tertiary">{dimensionSummary}</p>
      )}

      {mode === 'slider' && (
        <BeforeAfterSlider
          beforeSrc={beforeSrc}
          afterSrc={afterSrc}
          beforeLabel={t('upscaleCompareBefore')}
          afterLabel={t('upscaleCompareAfter')}
          objectFit="contain"
          intrinsicWidth={displaySize?.width}
          intrinsicHeight={displaySize?.height}
        />
      )}

      {mode === 'split' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className={cn(PREVIEW_CLASS, 'mx-auto w-full')} style={imageDisplayStyle}>
            <p className="absolute top-3 left-3 z-10 rounded bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
              {t('upscaleCompareBefore')}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={beforeSrc}
              alt={t('upscaleCompareBefore')}
              className="h-full w-full object-contain"
            />
          </div>
          <div className={cn(PREVIEW_CLASS, 'mx-auto w-full')} style={imageDisplayStyle}>
            <p className="absolute top-3 left-3 z-10 rounded bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
              {t('upscaleCompareAfter')}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={afterSrc}
              alt={t('upscaleCompareAfter')}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      )}

      {mode === 'before' && (
        <div className={cn(PREVIEW_CLASS, 'mx-auto w-full')} style={imageDisplayStyle}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={beforeSrc}
            alt={t('upscaleCompareBefore')}
            className="h-full w-full object-contain"
          />
        </div>
      )}

      {mode === 'after' && (
        <div className={cn(PREVIEW_CLASS, 'mx-auto w-full')} style={imageDisplayStyle}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={afterSrc}
            alt={t('upscaleCompareAfter')}
            className="h-full w-full object-contain"
          />
        </div>
      )}

      <p className="text-center text-[11px] text-text-tertiary">{t('upscaleCompareHint')}</p>
    </div>
  );
}
