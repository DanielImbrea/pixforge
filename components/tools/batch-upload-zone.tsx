'use client';

import { useCallback, useState, type ChangeEvent, type DragEvent } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { BATCH_MAX_FILES } from '@/lib/billing/plan-features';

interface BatchUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  acceptedFormats: string[];
  maxFiles?: number;
}

export function BatchUploadZone({
  onFilesSelected,
  acceptedFormats,
  maxFiles = BATCH_MAX_FILES,
}: BatchUploadZoneProps) {
  const t = useTranslations('tool');
  const [isDragging, setIsDragging] = useState(false);

  const pickFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const files = Array.from(fileList).slice(0, maxFiles);
      if (files.length > 0) onFilesSelected(files);
    },
    [maxFiles, onFilesSelected]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setIsDragging(false);
      pickFiles(e.dataTransfer.files);
    },
    [pickFiles]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      pickFiles(e.target.files);
    },
    [pickFiles]
  );

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center cursor-pointer transition-colors',
        isDragging ? 'border-accent bg-accent/5' : 'border-border-default hover:border-border-strong'
      )}
    >
      <input
        type="file"
        className="hidden"
        accept={acceptedFormats.join(',')}
        multiple
        onChange={handleChange}
      />
      <p className="text-sm font-medium text-text-primary">{t('batchUploadCta')}</p>
      <p className="text-xs text-text-tertiary">{t('batchUploadHint', { max: maxFiles })}</p>
    </label>
  );
}
