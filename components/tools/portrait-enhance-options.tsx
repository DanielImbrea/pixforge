'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import {
  PORTRAIT_INTENSITY_PRESETS,
  type PortraitEnhanceIntensity,
  type PortraitEnhanceMode,
  type PortraitEnhanceParams,
  type PortraitEnhancePreset,
} from '@/lib/tools/portrait-enhance-params';

interface PortraitEnhanceOptionsProps {
  value: PortraitEnhanceParams;
  onChange: (value: PortraitEnhanceParams) => void;
}

const MODE_OPTIONS: { value: PortraitEnhanceMode; labelKey: string; hintKey: string }[] = [
  {
    value: 'auto',
    labelKey: 'portraitEnhanceModeAuto',
    hintKey: 'portraitEnhanceModeAutoHint',
  },
  {
    value: 'enhance',
    labelKey: 'portraitEnhanceModeEnhance',
    hintKey: 'portraitEnhanceModeEnhanceHint',
  },
  {
    value: 'restore',
    labelKey: 'portraitEnhanceModeRestore',
    hintKey: 'portraitEnhanceModeRestoreHint',
  },
];

const PRESET_OPTIONS: { value: Exclude<PortraitEnhancePreset, 'custom'>; labelKey: string }[] = [
  { value: 'natural', labelKey: 'portraitEnhanceNatural' },
  { value: 'glamour', labelKey: 'portraitEnhanceGlamour' },
];

const INTENSITY_SLIDERS: {
  key: keyof PortraitEnhanceIntensity;
  labelKey: string;
}[] = [
  { key: 'overall', labelKey: 'portraitEnhanceOverall' },
  { key: 'skin', labelKey: 'portraitEnhanceSkin' },
  { key: 'eyes', labelKey: 'portraitEnhanceEyes' },
  { key: 'lips', labelKey: 'portraitEnhanceLips' },
  { key: 'teeth', labelKey: 'portraitEnhanceTeeth' },
  { key: 'underEye', labelKey: 'portraitEnhanceUnderEye' },
  { key: 'lighting', labelKey: 'portraitEnhanceLighting' },
];

function IntensitySlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="tabular-nums text-text-tertiary">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  );
}

export function PortraitEnhanceOptions({ value, onChange }: PortraitEnhanceOptionsProps) {
  const t = useTranslations('tool');
  const [showAdvanced, setShowAdvanced] = useState(value.preset === 'custom');

  const applyPreset = (preset: Exclude<PortraitEnhancePreset, 'custom'>) => {
    onChange({
      ...value,
      preset,
      intensity: { ...PORTRAIT_INTENSITY_PRESETS[preset] },
    });
    setShowAdvanced(false);
  };

  const setIntensity = (key: keyof PortraitEnhanceIntensity, n: number) => {
    onChange({
      ...value,
      preset: 'custom',
      intensity: { ...value.intensity, [key]: n },
    });
  };

  const selectedMode = MODE_OPTIONS.find((o) => o.value === value.mode);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">{t('portraitEnhanceMode')}</label>
        <div className="flex flex-wrap gap-2">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ ...value, mode: option.value })}
              className={cn(
                'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                value.mode === option.value
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border-default text-text-secondary hover:border-accent/40'
              )}
            >
              {t(option.labelKey as 'portraitEnhanceModeAuto')}
            </button>
          ))}
        </div>
        {selectedMode ? (
          <p className="text-xs text-text-tertiary">{t(selectedMode.hintKey as 'portraitEnhanceModeAutoHint')}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">{t('portraitEnhanceStyle')}</label>
        <p className="text-xs text-text-tertiary">{t('portraitEnhanceStyleHint')}</p>
        <div className="flex gap-2">
          {PRESET_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => applyPreset(option.value)}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                value.preset === option.value
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border-default text-text-secondary hover:border-border-strong'
              )}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border-default bg-background-secondary p-3">
        <IntensitySlider
          label={t('portraitEnhanceOverall')}
          value={value.intensity.overall}
          onChange={(n) => setIntensity('overall', n)}
        />
      </div>

      <button
        type="button"
        className="text-left text-xs font-medium text-accent hover:underline"
        onClick={() => setShowAdvanced((v) => !v)}
      >
        {showAdvanced ? t('portraitEnhanceHideAdvanced') : t('portraitEnhanceShowAdvanced')}
      </button>

      {showAdvanced ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border-default bg-background-secondary p-3">
          {INTENSITY_SLIDERS.filter((s) => s.key !== 'overall').map((slider) => (
            <IntensitySlider
              key={slider.key}
              label={t(slider.labelKey as 'portraitEnhanceSkin')}
              value={value.intensity[slider.key]}
              onChange={(n) => setIntensity(slider.key, n)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
