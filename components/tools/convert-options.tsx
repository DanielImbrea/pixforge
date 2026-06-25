'use client';

import { useTranslations } from 'next-intl';
import type { ConvertParams } from '@/lib/tools/convert-params';
import { cn } from '@/lib/utils/cn';

export type ConvertOptionsValue = ConvertParams;

interface ConvertOptionsProps {
  value: ConvertOptionsValue;
  onChange: (value: ConvertOptionsValue) => void;
  imageMimeType?: string | null;
}

const selectClassName =
  'w-full rounded-md border border-border-default bg-background-primary px-3 py-2 text-sm text-text-primary';

const ALPHA_MIME_TYPES = new Set(['image/png', 'image/webp', 'image/avif', 'image/gif']);

function isOpaqueBackgroundChoice(fill: ConvertParams['backgroundFill']): boolean {
  return fill === 'black' || fill === 'blur' || fill === 'auto';
}

export function ConvertOptions({ value, onChange, imageMimeType }: ConvertOptionsProps) {
  const t = useTranslations('tool');

  const mightHaveAlpha = imageMimeType ? ALPHA_MIME_TYPES.has(imageMimeType) : null;
  const opaqueBackground = isOpaqueBackgroundChoice(value.backgroundFill);
  const losslessFormat =
    value.targetFormat === 'png' ||
    value.targetFormat === 'webp' ||
    value.targetFormat === 'avif';

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
          <option value="balanced">{t('convertIntentBalanced')}</option>
          <option value="fast">{t('convertIntentFast')}</option>
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
        {losslessFormat && value.backgroundFill === 'white' && (
          <p className="text-[11px] text-text-tertiary">{t('convertBackgroundWhiteLossless')}</p>
        )}
        {opaqueBackground && (
          <p
            className={cn(
              'text-[11px]',
              mightHaveAlpha === false ? 'text-text-tertiary' : 'text-text-secondary'
            )}
          >
            {mightHaveAlpha === false
              ? t('convertBackgroundNoAlpha')
              : t('convertBackgroundOpaqueNote')}
          </p>
        )}
        {value.targetFormat === 'jpeg' && mightHaveAlpha === false && value.backgroundFill === 'white' && (
          <p className="text-[11px] text-text-tertiary">{t('convertBackgroundNoAlpha')}</p>
        )}
      </div>
    </div>
  );
}
