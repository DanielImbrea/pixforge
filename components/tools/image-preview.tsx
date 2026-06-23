'use client';

import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { UploadZone } from './upload-zone';

interface ImagePreviewProps {
  file: File | null;
  previewUrl: string | null;
  acceptedFormats: string[];
  onFileSelected: (file: File) => void;
  onClear: () => void;
}

export function ImagePreview({
  file,
  previewUrl,
  acceptedFormats,
  onFileSelected,
  onClear,
}: ImagePreviewProps) {
  const t = useTranslations('tool');

  if (!file || !previewUrl) {
    return <UploadZone onFileSelected={onFileSelected} acceptedFormats={acceptedFormats} />;
  }

  return (
    <div className="relative rounded-lg border border-border-default overflow-hidden bg-background-secondary">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl}
        alt={t('previewAlt')}
        className="w-full h-auto max-h-[420px] object-contain"
      />
      <div className="absolute top-3 left-3 rounded-md bg-background-primary/90 px-2 py-1 text-xs text-text-secondary backdrop-blur-sm">
        {file.name}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-md bg-background-primary/90 text-text-secondary hover:text-text-primary backdrop-blur-sm transition-colors"
        aria-label={t('removeImage')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
