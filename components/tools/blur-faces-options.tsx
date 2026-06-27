'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { BlurFacesParams } from '@/lib/tools/blur-faces-params';

interface BlurFacesOptionsProps {
  value: BlurFacesParams;
  onChange: (value: BlurFacesParams) => void;
  onReferenceFileChange: (file: File | null) => void;
  referencePreviewUrl: string | null;
}

const selectClassName =
  'w-full rounded-md border border-border-default bg-background-primary px-3 py-2 text-sm text-text-primary';

export function BlurFacesOptions({
  value,
  onChange,
  onReferenceFileChange,
  referencePreviewUrl,
}: BlurFacesOptionsProps) {
  const t = useTranslations('tool');
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">{t('blurFacesDetectionMode')}</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onChange({ ...value, detectionMode: 'automatic', referenceAssetId: undefined })}
            className={`rounded-lg border px-3 py-3 text-left text-sm ${
              value.detectionMode === 'automatic'
                ? 'border-accent bg-accent/10'
                : 'border-border-default hover:border-accent/40'
            }`}
          >
            <span className="font-medium text-text-primary">{t('blurFacesAutomatic')}</span>
            <span className="mt-1 block text-xs text-text-tertiary">{t('blurFacesAutomaticHint')}</span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...value, detectionMode: 'custom' })}
            className={`rounded-lg border px-3 py-3 text-left text-sm ${
              value.detectionMode === 'custom'
                ? 'border-accent bg-accent/10'
                : 'border-border-default hover:border-accent/40'
            }`}
          >
            <span className="font-medium text-text-primary">{t('blurFacesCustom')}</span>
            <span className="mt-1 block text-xs text-text-tertiary">{t('blurFacesCustomHint')}</span>
          </button>
        </div>
      </div>

      {value.detectionMode === 'custom' ? (
        <div className="rounded-lg border border-border-default bg-background-secondary p-4 space-y-3">
          <p className="text-xs text-text-secondary">{t('blurFacesReferenceHint')}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => onReferenceFileChange(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-border-default px-3 py-2 text-sm text-text-primary hover:border-accent/40"
            >
              {t('blurFacesAddPortrait')}
            </button>
            {referencePreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={referencePreviewUrl}
                alt=""
                className="h-16 w-16 rounded-md border border-border-default object-cover"
              />
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onChange({ ...value, customAction: 'blur' })}
              className={`rounded-md border px-3 py-2 text-sm ${
                value.customAction === 'blur'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border-default text-text-secondary'
              }`}
            >
              {t('blurFacesBlurThisFace')}
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...value, customAction: 'exclude' })}
              className={`rounded-md border px-3 py-2 text-sm ${
                value.customAction === 'exclude'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border-default text-text-secondary'
              }`}
            >
              {t('blurFacesExcludeThisFace')}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">{t('blurFacesStrength')}</label>
        <select
          className={selectClassName}
          value={value.blurStrength}
          onChange={(e) =>
            onChange({
              ...value,
              blurStrength: e.target.value as BlurFacesParams['blurStrength'],
            })
          }
        >
          <option value="low">{t('blurFacesStrengthLow')}</option>
          <option value="medium">{t('blurFacesStrengthMedium')}</option>
          <option value="strong">{t('blurFacesStrengthStrong')}</option>
        </select>
      </div>
    </div>
  );
}
