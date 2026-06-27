'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface ProcessingStateProps {
  progress?: number;
  label?: string;
  isAiTool?: boolean;
  isUpscaleTool?: boolean;
  isFacesTool?: boolean;
}

const SLOW_THRESHOLD_MS = 20_000;
const UPSCALE_MESSAGE_KEYS = [
  'processingUpscaleStep1',
  'processingUpscaleStep2',
  'processingUpscaleStep3',
] as const;

export function ProcessingState({
  progress = 0,
  label,
  isAiTool = false,
  isUpscaleTool = false,
  isFacesTool = false,
}: ProcessingStateProps) {
  const t = useTranslations('tool');
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const [showSlowHint, setShowSlowHint] = useState(false);
  const [upscaleMessageIndex, setUpscaleMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setShowSlowHint(true), SLOW_THRESHOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isUpscaleTool) return;
    const timer = setInterval(() => {
      setUpscaleMessageIndex((current) => (current + 1) % UPSCALE_MESSAGE_KEYS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isUpscaleTool]);

  const defaultLabel = isUpscaleTool
    ? t(UPSCALE_MESSAGE_KEYS[upscaleMessageIndex])
    : isFacesTool
      ? t('processingBlurFaces')
      : t('processing');

  return (
    <div className="flex flex-col items-center justify-center gap-5 p-12 text-center">
      <div className="w-full max-w-sm">
        <div className="mb-2 flex items-center justify-between text-xs text-text-tertiary">
          <span>{label || defaultLabel}</span>
          <span>{Math.round(clampedProgress)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-background-secondary">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      </div>
      <p className="text-sm font-medium text-text-primary">{t('processingKeepOpen')}</p>
      <p className="text-sm text-text-secondary">
        {isUpscaleTool
          ? t('processingUpscaleHint')
          : isFacesTool
            ? t('processingBlurFacesHint')
            : t('processingHint')}
      </p>
      {isAiTool && !isFacesTool && (
        <p className="text-xs text-text-tertiary">{t('processingAiNote')}</p>
      )}
      {showSlowHint && (
        <p className="text-xs text-text-tertiary animate-pulse">{t('processingSlowHint')}</p>
      )}
    </div>
  );
}
