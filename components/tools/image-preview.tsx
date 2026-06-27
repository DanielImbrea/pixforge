'use client';

import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { UploadZone } from './upload-zone';

interface ImagePreviewProps {
  file: File | null;
  previewUrl: string | null;
  acceptedFormats: string[];
  originalDimensions?: { width: number; height: number } | null;
  onFileSelected: (file: File) => void;
  onClear: () => void;
}

export function ImagePreview({
  file,
  previewUrl,
  acceptedFormats,
  originalDimensions,
  onFileSelected,
  onClear,
}: ImagePreviewProps) {
  const t = useTranslations('tool');

  if (!file || !previewUrl) {
    return <UploadZone onFileSelected={onFileSelected} acceptedFormats={acceptedFormats} />;
  }

  return (
    <div className="rounded-lg border border-border-default overflow-hidden bg-background-secondary">
      <div className="flex items-start justify-between gap-3 border-b border-border-default bg-background-primary px-3 py-2">
        <div className="min-w-0 flex flex-col gap-0.5">
          <p className="truncate text-xs text-text-secondary">{file.name}</p>
          {originalDimensions && (
            <p className="text-[11px] tabular-nums text-text-tertiary">
              {originalDimensions.width} × {originalDimensions.height} px
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClear}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-background-secondary hover:text-text-primary"
          aria-label={t('removeImage')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl}
        alt={t('previewAlt')}
        className="h-auto max-h-[420px] w-full object-contain"
      />
    </div>
  );
}
