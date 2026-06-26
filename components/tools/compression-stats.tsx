'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { formatBytesPrecise } from '@/lib/utils/format';

interface CompressionStatsProps {
  savedPercent: number;
  alreadyOptimized?: boolean;
  inputBytes: number;
  outputBytes: number;
  /** Use "Result" label instead of "Compressed" (e.g. resize tool). */
  outputLabel?: 'compressed' | 'result';
  dimensionsLabel?: string | null;
  compressionLevel?: 'fast' | 'balanced' | 'max' | null;
}

interface CompressionStatsRingProps {
  savedPercent: number;
  alreadyOptimized?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const BRAND_SOFT = '#7f77dd';
const BRAND_PRIMARY = '#534AB7';
const BRAND_LIGHT = '#CECBF6';
const BRAND_INK = '#26215C';

const RING_RADIUS = 38;
const RING_STROKE = 6;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function computeSavedPercent(inputBytes: number, outputBytes: number): number {
  if (inputBytes <= 0 || outputBytes >= inputBytes) return 0;
  return Math.round((1 - outputBytes / inputBytes) * 1000) / 10;
}

function formatSavedPercent(value: number): string {
  if (value <= 0) return '0';
  if (value >= 10) return String(Math.round(value));
  return value.toFixed(1).replace(/\.0$/, '');
}

export function CompressionStatsRing({
  savedPercent,
  alreadyOptimized = false,
  size = 'md',
  className,
}: CompressionStatsRingProps) {
  const t = useTranslations('tool');
  const gradientId = useId();
  const hasReduction = savedPercent > 0 && !alreadyOptimized;
  const ringPercent = hasReduction ? Math.min(100, savedPercent) : 0;
  const dashOffset = RING_CIRCUMFERENCE * (1 - ringPercent / 100);
  const displayPercent = formatSavedPercent(alreadyOptimized ? 0 : savedPercent);
  const arcLabel = hasReduction ? t('compressionSaved') : t('compressionOptimized');
  const isSmall = size === 'sm';

  return (
    <div className={cn('flex shrink-0 flex-col items-center', className)}>
      <div
        className={cn('relative', isSmall ? 'h-16 w-16' : 'h-28 w-28')}
        aria-label={`${displayPercent}% ${arcLabel}`}
      >
        <div
          className="absolute inset-1 rounded-full"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${BRAND_LIGHT}66 0%, ${BRAND_SOFT}18 55%, transparent 100%)`,
          }}
        />
        <svg className={cn('relative', isSmall ? 'h-16 w-16' : 'h-28 w-28')} viewBox="0 0 100 100" aria-hidden>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={BRAND_PRIMARY} />
              <stop offset="100%" stopColor={BRAND_SOFT} />
            </linearGradient>
          </defs>
          <g transform="rotate(-90 50 50)">
            <circle
              cx="50"
              cy="50"
              r={RING_RADIUS}
              fill="none"
              stroke={BRAND_LIGHT}
              strokeWidth={RING_STROKE}
            />
            <circle
              cx="50"
              cy="50"
              r={RING_RADIUS}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
              style={{ filter: `drop-shadow(0 0 6px ${BRAND_SOFT}55)` }}
            />
          </g>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className={cn(
              'font-bold leading-none tabular-nums',
              isSmall ? 'text-sm' : 'text-[1.35rem]'
            )}
            style={{ color: BRAND_INK }}
          >
            {displayPercent}%
          </span>
        </div>
      </div>
      <span
        className={cn(
          'mt-1 font-semibold uppercase tracking-[0.14em]',
          isSmall ? 'text-[7px]' : 'text-[9px]'
        )}
        style={{ color: BRAND_SOFT }}
      >
        {arcLabel}
      </span>
    </div>
  );
}

export function CompressionStats({
  savedPercent,
  alreadyOptimized = false,
  inputBytes,
  outputBytes,
  outputLabel = 'compressed',
  dimensionsLabel = null,
  compressionLevel = null,
}: CompressionStatsProps) {
  const t = useTranslations('tool');
  const hasReduction = savedPercent > 0 && !alreadyOptimized;
  const displayPercent = formatSavedPercent(alreadyOptimized ? 0 : savedPercent);
  const outputLabelText =
    outputLabel === 'result' ? t('sizeCompareResult') : t('compressionCompressed');
  const compressionLevelLabel =
    compressionLevel === 'fast'
      ? t('compressLevelMaximum')
      : compressionLevel === 'max'
        ? t('compressLevelLow')
        : compressionLevel === 'balanced'
          ? t('compressLevelBalanced')
          : null;

  return (
    <div
      className="flex items-center gap-5 rounded-xl border px-5 py-5 shadow-sm sm:gap-6"
      style={{
        borderColor: `${BRAND_SOFT}33`,
        background: `linear-gradient(135deg, #ffffff 0%, ${BRAND_SOFT}14 100%)`,
      }}
    >
      <CompressionStatsRing savedPercent={savedPercent} alreadyOptimized={alreadyOptimized} />

      <div className="min-w-0 flex-1 space-y-3">
        <p className="text-sm font-medium leading-snug" style={{ color: BRAND_INK }}>
          {alreadyOptimized
            ? t('compressionAlreadyOptimized')
            : hasReduction
              ? t('compressionHeadline', { percent: displayPercent })
              : t('compressionHeadlineNoReduction')}
        </p>
        <dl className="space-y-1.5 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-text-secondary">{t('compressionOriginal')}</dt>
            <dd className="font-semibold tabular-nums" style={{ color: BRAND_INK }}>
              {formatBytesPrecise(inputBytes)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-text-secondary">{outputLabelText}</dt>
            <dd className="font-semibold tabular-nums" style={{ color: BRAND_PRIMARY }}>
              {formatBytesPrecise(outputBytes)}
            </dd>
          </div>
          {hasReduction && (
            <div className="flex items-baseline justify-between gap-4 border-t border-border-default/60 pt-1.5">
              <dt className="font-medium" style={{ color: BRAND_SOFT }}>
                {t('compressionSavedLabel')}
              </dt>
              <dd className="font-bold tabular-nums" style={{ color: BRAND_PRIMARY }}>
                {displayPercent}%
              </dd>
            </div>
          )}
          {dimensionsLabel ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-text-secondary">{t('compressionDimensions')}</dt>
              <dd className="font-medium tabular-nums text-text-primary">{dimensionsLabel}</dd>
            </div>
          ) : null}
          {compressionLevelLabel ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-text-secondary">{t('compressionLevelLabel')}</dt>
              <dd className="font-medium text-text-primary">{compressionLevelLabel}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  );
}
