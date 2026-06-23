'use client';

import { useCallback, useState, type ChangeEvent, type DragEvent } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  acceptedFormats: string[];
  disabled?: boolean;
}

export function UploadZone({ onFileSelected, acceptedFormats, disabled }: UploadZoneProps) {
  const t = useTranslations('tool');
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected, disabled]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 text-center cursor-pointer transition-colors',
        isDragging ? 'border-accent bg-accent/5' : 'border-border-default hover:border-border-strong',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input
        type="file"
        className="hidden"
        accept={acceptedFormats.join(',')}
        onChange={handleChange}
        disabled={disabled}
      />
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-text-tertiary"
      >
        <path d="M12 16V4M12 4L7 9M12 4L17 9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 16V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V16" strokeLinecap="round" />
      </svg>
      <p className="text-sm text-text-secondary">{t('uploadCta')}</p>
    </label>
  );
}
