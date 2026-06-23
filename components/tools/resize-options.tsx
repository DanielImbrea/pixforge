'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';

export interface ResizeOptionsValue {
  width?: number;
  height?: number;
}

interface ResizeOptionsProps {
  value: ResizeOptionsValue;
  onChange: (value: ResizeOptionsValue) => void;
  error?: string | null;
}

export function ResizeOptions({ value, onChange, error }: ResizeOptionsProps) {
  const t = useTranslations('tool');

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-text-primary">{t('resizeDimensions')}</label>
      <p className="text-xs text-text-tertiary">{t('resizeDimensionsHint')}</p>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-xs text-text-tertiary mb-1 block">{t('widthPx')}</label>
          <Input
            type="number"
            min={1}
            max={10000}
            placeholder="1920"
            value={value.width ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                width: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-text-tertiary mb-1 block">{t('heightPx')}</label>
          <Input
            type="number"
            min={1}
            max={10000}
            placeholder="1080"
            value={value.height ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                height: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
