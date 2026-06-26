'use client';

import { useTranslations } from 'next-intl';
import type { CompressParams } from '@/lib/tools/compress-params';

const selectClassName =
  'w-full rounded-md border border-border-default bg-background-primary px-3 py-2 text-sm text-text-primary';

interface CompressOptionsProps {
  value: CompressParams;
  onChange: (value: CompressParams) => void;
}

export function CompressOptions({ value, onChange }: CompressOptionsProps) {
  const t = useTranslations('tool');

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-text-primary">{t('compressQualityLabel')}</label>
      <p className="text-xs text-text-tertiary">{t('compressQualityHint')}</p>
      <select
        className={selectClassName}
        value={value.qualityIntent}
        onChange={(e) =>
          onChange({
            ...value,
            qualityIntent: e.target.value as CompressParams['qualityIntent'],
          })
        }
      >
        <option value="fast">{t('compressLevelMaximum')}</option>
        <option value="balanced">{t('compressLevelBalanced')}</option>
        <option value="max">{t('compressLevelLow')}</option>
      </select>
    </div>
  );
}
