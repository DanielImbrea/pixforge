'use client';

import { useTranslations } from 'next-intl';
import type { ObjectRemoveEditMode, ObjectRemoveParams } from '@/lib/tools/object-remove-params';

interface ObjectRemoveOptionsProps {
  value: ObjectRemoveParams;
  onChange: (value: ObjectRemoveParams) => void;
}

const inputClassName =
  'w-full rounded-md border border-border-default bg-background-primary px-3 py-2 text-sm text-text-primary';

const modeButtonClass = (active: boolean) =>
  `flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
    active
      ? 'border-accent bg-accent/10 text-accent font-medium'
      : 'border-border-default text-text-secondary hover:border-accent/40'
  }`;

export function ObjectRemoveOptions({ value, onChange }: ObjectRemoveOptionsProps) {
  const t = useTranslations('tool');

  const setEditMode = (editMode: ObjectRemoveEditMode) => {
    onChange({
      ...value,
      editMode,
      ...(editMode === 'remove' ? { inpaintPrompt: '' } : {}),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">{t('objectRemoveEditMode')}</label>
        <p className="text-xs text-text-tertiary">{t('objectRemoveEditModeHint')}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className={modeButtonClass(value.editMode === 'remove')}
            onClick={() => setEditMode('remove')}
          >
            {t('objectRemoveModeRemove')}
          </button>
          <button
            type="button"
            className={modeButtonClass(value.editMode === 'replace')}
            onClick={() => setEditMode('replace')}
          >
            {t('objectRemoveModeReplace')}
          </button>
        </div>
      </div>

      {value.editMode === 'remove' ? (
        <p className="rounded-md border border-border-default bg-background-secondary px-3 py-2 text-xs text-text-secondary">
          {t('objectRemoveModeRemoveHint')}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-primary">{t('objectRemovePrompt')}</label>
          <p className="text-xs text-text-tertiary">{t('objectRemovePromptHint')}</p>
          <input
            type="text"
            className={inputClassName}
            value={value.inpaintPrompt}
            maxLength={300}
            placeholder={t('objectRemovePromptPlaceholder')}
            onChange={(e) => onChange({ ...value, inpaintPrompt: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
