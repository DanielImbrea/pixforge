'use client';

import { useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  EXPORT_SCALE_MAX,
  EXPORT_SCALE_MIN,
} from '@/lib/tools/download-export/types';
import {
  formatEstimatedSize,
  formatScaleMultiplierLabel,
} from '@/lib/tools/download-export/settings';
import { ProBadge } from '@/components/ui/pro-badge';
import { cn } from '@/lib/utils/cn';

interface ExportSizeSliderProps {
  multiplier: number;
  processedWidth: number;
  processedHeight: number;
  exportWidth: number;
  exportHeight: number;
  estimatedBytes: number | null;
  locked: boolean;
  onMultiplierChange: (value: number) => void;
  onLockedInteraction: () => void;
}

function multiplierToSliderValue(multiplier: number): number {
  const minLog = Math.log(EXPORT_SCALE_MIN);
  const maxLog = Math.log(EXPORT_SCALE_MAX);
  const valueLog = Math.log(Math.min(EXPORT_SCALE_MAX, Math.max(EXPORT_SCALE_MIN, multiplier)));
  return ((valueLog - minLog) / (maxLog - minLog)) * 100;
}

function sliderValueToMultiplier(value: number): number {
  const minLog = Math.log(EXPORT_SCALE_MIN);
  const maxLog = Math.log(EXPORT_SCALE_MAX);
  const ratio = Math.min(100, Math.max(0, value)) / 100;
  const multiplier = Math.exp(minLog + ratio * (maxLog - minLog));
  return Math.round(multiplier * 1000) / 1000;
}

export function ExportSizeSlider({
  multiplier,
  processedWidth,
  processedHeight,
  exportWidth,
  exportHeight,
  estimatedBytes,
  locked,
  onMultiplierChange,
  onLockedInteraction,
}: ExportSizeSliderProps) {
  const t = useTranslations('tool');
  const trackRef = useRef<HTMLDivElement>(null);
  const sliderValue = multiplierToSliderValue(locked ? 1 : multiplier);
  const displayMultiplier = locked ? 1 : multiplier;

  const handleSliderChange = useCallback(
    (next: number) => {
      if (locked) {
        onLockedInteraction();
        return;
      }
      onMultiplierChange(sliderValueToMultiplier(next));
    },
    [locked, onLockedInteraction, onMultiplierChange]
  );

  const handleTrackPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      handleSliderChange(ratio * 100);
    },
    [handleSliderChange]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-text-primary">{t('downloadModalSize')}</label>
        {locked && <ProBadge onClick={onLockedInteraction} />}
      </div>

      <div className="flex items-center justify-between text-[11px] font-medium text-text-tertiary tabular-nums">
        <span>{EXPORT_SCALE_MIN}x</span>
        <span>{EXPORT_SCALE_MAX}x</span>
      </div>

      <div
        ref={trackRef}
        className={cn(
          'relative h-2 rounded-full bg-border-default',
          locked ? 'cursor-pointer' : 'cursor-pointer'
        )}
        onClick={(e) => handleTrackPointer(e.clientX)}
        onKeyDown={() => undefined}
        role="presentation"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-75 ease-out"
          style={{ width: `${sliderValue}%` }}
        />
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={sliderValue}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          onPointerDown={() => {
            if (locked) onLockedInteraction();
          }}
          className={cn(
            'absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0',
            locked && 'pointer-events-none'
          )}
          aria-label={t('downloadModalSize')}
          aria-valuemin={EXPORT_SCALE_MIN}
          aria-valuemax={EXPORT_SCALE_MAX}
          aria-valuenow={displayMultiplier}
        />
        <div
          className={cn(
            'pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow-md transition-[left] duration-75 ease-out',
            locked && 'opacity-90'
          )}
          style={{ left: `calc(${sliderValue}% - 10px)` }}
        />
        {locked && (
          <button
            type="button"
            className="absolute inset-0 z-10 cursor-pointer"
            aria-label={t('downloadProBadgeHover')}
            onClick={onLockedInteraction}
          />
        )}
      </div>

      <div className="rounded-lg border border-border-default bg-background-secondary/50 px-3 py-2.5 space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-text-tertiary">{t('downloadModalCurrentScale')}</span>
          <span className="text-sm font-semibold tabular-nums text-text-primary">
            {formatScaleMultiplierLabel(displayMultiplier)}
          </span>
        </div>
        <p className="text-sm tabular-nums text-text-primary">
          {exportWidth.toLocaleString()} × {exportHeight.toLocaleString()} px
        </p>
        <div className="flex items-baseline justify-between gap-2 pt-0.5">
          <span className="text-xs text-text-tertiary">{t('downloadModalEstimatedSize')}</span>
          <span className="text-xs font-medium tabular-nums text-text-secondary">
            {formatEstimatedSize(estimatedBytes)}
          </span>
        </div>
        {displayMultiplier === 1 && (
          <p className="text-[11px] text-text-tertiary pt-0.5">
            {t('downloadModalBaseSize', {
              width: processedWidth.toLocaleString(),
              height: processedHeight.toLocaleString(),
            })}
          </p>
        )}
      </div>
    </div>
  );
}
