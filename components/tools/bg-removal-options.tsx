'use client';

import { useTranslations } from 'next-intl';
import type { BgRemovalParams } from '@/lib/tools/bg-removal-params';

export type BgRemovalOptionsValue = BgRemovalParams;

interface BgRemovalOptionsProps {
  value: BgRemovalOptionsValue;
  onChange: (value: BgRemovalOptionsValue) => void;
}

const selectClassName =
  'w-full rounded-md border border-border-default bg-background-primary px-3 py-2 text-sm text-text-primary';

export function BgRemovalOptions({ value, onChange }: BgRemovalOptionsProps) {
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
              subjectMode: e.target.value as BgRemovalOptionsValue['subjectMode'],
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
              edgeQuality: e.target.value as BgRemovalOptionsValue['edgeQuality'],
            })
          }
        >
          <option value="standard">{t('bgEdgeStandard')}</option>
          <option value="high">{t('bgEdgeHigh')}</option>
          <option value="studio">{t('bgEdgeStudio')}</option>
        </select>
      </div>
    </div>
  );
}
