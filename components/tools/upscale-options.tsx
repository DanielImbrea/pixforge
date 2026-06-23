'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';

export type UpscaleScale = 2 | 4;

export interface UpscaleOptionsValue {
  scale: UpscaleScale;
}

interface UpscaleOptionsProps {
  value: UpscaleOptionsValue;
  onChange: (value: UpscaleOptionsValue) => void;
}

const SCALE_OPTIONS: { value: UpscaleScale; labelKey: 'scale2x' | 'scale4x' }[] = [
  { value: 2, labelKey: 'scale2x' },
  { value: 4, labelKey: 'scale4x' },
];

export function UpscaleOptions({ value, onChange }: UpscaleOptionsProps) {
  const t = useTranslations('tool');

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-text-primary">{t('upscaleQuality')}</label>
      <p className="text-xs text-text-tertiary">{t('upscaleQualityHint')}</p>
      <div className="grid grid-cols-2 gap-2">
        {SCALE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange({ scale: option.value })}
            className={cn(
              'rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
              value.scale === option.value
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary'
            )}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
