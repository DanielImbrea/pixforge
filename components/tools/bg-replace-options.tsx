'use client';

import { useTranslations } from 'next-intl';
import type { BgReplaceParams, BgReplacePreset } from '@/lib/tools/bg-replace-params';

export type BgReplaceOptionsValue = BgReplaceParams;

interface BgReplaceOptionsProps {
  value: BgReplaceOptionsValue;
  onChange: (value: BgReplaceOptionsValue) => void;
}

const selectClassName =
  'w-full rounded-md border border-border-default bg-background-primary px-3 py-2 text-sm text-text-primary';

const PRESET_GROUPS: { labelKey: string; presets: BgReplacePreset[] }[] = [
  {
    labelKey: 'bgReplaceGroupMarketplace',
    presets: ['white', 'amazon_white', 'studio_gray'],
  },
  {
    labelKey: 'bgReplaceGroupStudio',
    presets: ['studio_soft'],
  },
  {
    labelKey: 'bgReplaceGroupScenic',
    presets: ['tokyo_night', 'nature_jungle', 'sunset_beach'],
  },
  {
    labelKey: 'bgReplaceGroupCustom',
    presets: ['custom'],
  },
];

export function BgReplaceOptions({ value, onChange }: BgReplaceOptionsProps) {
  const t = useTranslations('tool');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">{t('bgSubjectMode')}</label>
        <p className="text-xs text-text-tertiary">{t('bgSubjectModeHint')}</p>
        <select
          className={selectClassName}
          value={value.subjectMode}
          onChange={(e) =>
            onChange({
              ...value,
              subjectMode: e.target.value as BgReplaceOptionsValue['subjectMode'],
            })
          }
        >
          <option value="auto">{t('bgModeAuto')}</option>
          <option value="product">{t('bgModeProduct')}</option>
          <option value="portrait">{t('bgModePortrait')}</option>
          <option value="object">{t('bgModeObject')}</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">{t('bgEdgeQuality')}</label>
        <p className="text-xs text-text-tertiary">{t('bgEdgeQualityHint')}</p>
        <select
          className={selectClassName}
          value={value.edgeQuality}
          onChange={(e) =>
            onChange({
              ...value,
              edgeQuality: e.target.value as BgReplaceOptionsValue['edgeQuality'],
            })
          }
        >
          <option value="standard">{t('bgEdgeStandard')}</option>
          <option value="high">{t('bgEdgeHigh')}</option>
          <option value="studio">{t('bgEdgeStudio')}</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">{t('bgReplacePreset')}</label>
        <p className="text-xs text-text-tertiary">{t('bgReplacePresetHint')}</p>
        <select
          className={selectClassName}
          value={value.backgroundPreset}
          onChange={(e) =>
            onChange({
              ...value,
              backgroundPreset: e.target.value as BgReplacePreset,
            })
          }
        >
          {PRESET_GROUPS.map((group) => (
            <optgroup key={group.labelKey} label={t(group.labelKey as 'bgReplaceGroupMarketplace')}>
              {group.presets.map((preset) => (
                <option key={preset} value={preset}>
                  {t(`bgReplacePreset_${preset}` as 'bgReplacePreset_white')}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {value.backgroundPreset === 'custom' && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-primary">{t('bgReplaceCustomPrompt')}</label>
          <p className="text-xs text-text-tertiary">{t('bgReplaceCustomPromptHint')}</p>
          <textarea
            className={`${selectClassName} min-h-[88px] resize-y`}
            value={value.backgroundPrompt}
            maxLength={500}
            placeholder={t('bgReplaceCustomPromptPlaceholder')}
            onChange={(e) =>
              onChange({
                ...value,
                backgroundPrompt: e.target.value,
              })
            }
          />
        </div>
      )}
    </div>
  );
}
