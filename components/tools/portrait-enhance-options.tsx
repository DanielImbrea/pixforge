'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import type { PortraitEnhanceParams, PortraitEnhanceStyle } from '@/lib/tools/portrait-enhance-params';

interface PortraitEnhanceOptionsProps {
  value: PortraitEnhanceParams;
  onChange: (value: PortraitEnhanceParams) => void;
}

const STYLE_OPTIONS: {
  value: PortraitEnhanceStyle;
  labelKey: 'portraitEnhanceNatural' | 'portraitEnhanceGlamour';
  hintKey: 'portraitEnhanceNaturalHint' | 'portraitEnhanceGlamourHint';
}[] = [
  {
    value: 'natural',
    labelKey: 'portraitEnhanceNatural',
    hintKey: 'portraitEnhanceNaturalHint',
  },
  {
    value: 'glamour',
    labelKey: 'portraitEnhanceGlamour',
    hintKey: 'portraitEnhanceGlamourHint',
  },
];

export function PortraitEnhanceOptions({ value, onChange }: PortraitEnhanceOptionsProps) {
  const t = useTranslations('tool');
  const selected = STYLE_OPTIONS.find((option) => option.value === value.enhanceStyle);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-text-primary">{t('portraitEnhanceStyle')}</label>
      <p className="text-xs text-text-tertiary">{t('portraitEnhanceStyleHint')}</p>
      <div className="flex flex-col gap-2">
        {STYLE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange({ enhanceStyle: option.value })}
            className={cn(
              'w-full rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors',
              value.enhanceStyle === option.value
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary'
            )}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>
      {selected && <p className="text-xs text-text-tertiary">{t(selected.hintKey)}</p>}
    </div>
  );
}
