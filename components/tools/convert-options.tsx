'use client';

import { useTranslations } from 'next-intl';
import type { ConvertParams } from '@/lib/tools/convert-params';

export type ConvertOptionsValue = ConvertParams;

interface ConvertOptionsProps {
  value: ConvertOptionsValue;
  onChange: (value: ConvertOptionsValue) => void;
}

const selectClassName =
  'w-full rounded-md border border-border-default bg-background-primary px-3 py-2 text-sm text-text-primary';

export function ConvertOptions({ value, onChange }: ConvertOptionsProps) {
  const t = useTranslations('tool');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">{t('convertQualityIntent')}</label>
        <p className="text-xs text-text-tertiary">{t('convertQualityIntentHint')}</p>
        <select
          className={selectClassName}
          value={value.qualityIntent}
          onChange={(e) =>
            onChange({
              ...value,
              qualityIntent: e.target.value as ConvertOptionsValue['qualityIntent'],
            })
          }
        >
          <option value="fast">{t('convertIntentFast')}</option>
          <option value="balanced">{t('convertIntentBalanced')}</option>
          <option value="max">{t('convertIntentMax')}</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">{t('convertTargetFormat')}</label>
        <p className="text-xs text-text-tertiary">{t('convertTargetFormatHint')}</p>
        <select
          className={selectClassName}
          value={value.targetFormat}
          onChange={(e) =>
            onChange({
              ...value,
              targetFormat: e.target.value as ConvertOptionsValue['targetFormat'],
            })
          }
        >
          <option value="auto">{t('convertFormatAuto')}</option>
          <option value="avif">AVIF</option>
          <option value="webp">WebP</option>
          <option value="png">PNG</option>
          <option value="jpeg">JPEG</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">{t('convertBackgroundFill')}</label>
        <p className="text-xs text-text-tertiary">{t('convertBackgroundFillHint')}</p>
        <select
          className={selectClassName}
          value={value.backgroundFill}
          onChange={(e) =>
            onChange({
              ...value,
              backgroundFill: e.target.value as ConvertOptionsValue['backgroundFill'],
            })
          }
        >
          <option value="white">{t('convertBgWhite')}</option>
          <option value="black">{t('convertBgBlack')}</option>
          <option value="blur">{t('convertBgBlur')}</option>
          <option value="auto">{t('convertBgAuto')}</option>
        </select>
      </div>
    </div>
  );
}
