'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import type { UpscaleScaleInput } from '@/lib/tools/upscale-params';

export interface UpscaleOptionsValue {
  scale: UpscaleScaleInput;
}

interface UpscaleOptionsProps {
  value: UpscaleOptionsValue;
  onChange: (value: UpscaleOptionsValue) => void;
}

const SCALE_OPTIONS: {
  value: UpscaleScaleInput;
  labelKey: 'scaleSmart' | 'scale2x' | 'scale4x';
  hintKey?: 'scaleSmartHint' | 'scale4xHint';
}[] = [
  { value: 'smart', labelKey: 'scaleSmart', hintKey: 'scaleSmartHint' },
  { value: 2, labelKey: 'scale2x' },
  { value: 4, labelKey: 'scale4x', hintKey: 'scale4xHint' },
];

export function UpscaleOptions({ value, onChange }: UpscaleOptionsProps) {
  const t = useTranslations('tool');
  const selectedOption = SCALE_OPTIONS.find((option) => option.value === value.scale);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-text-primary">{t('upscaleQuality')}</label>
      <p className="text-xs text-text-tertiary">{t('upscaleQualityHint')}</p>
      <div className="grid grid-cols-3 gap-2">
        {SCALE_OPTIONS.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange({ scale: option.value })}
            className={cn(
              'rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors',
              value.scale === option.value
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary'
            )}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>
      {selectedOption?.hintKey && (
        <p className="text-xs text-text-tertiary">{t(selectedOption.hintKey)}</p>
      )}
      {value.scale === 4 && (
        <p className="text-xs rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-warning">
          {t('upscaleWarn4xGeneric')}
        </p>
      )}
    </div>
  );
}
