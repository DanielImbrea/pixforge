'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { CropEditor } from './crop-editor';
import { DEFAULT_CROP_PARAMS, type CropParams } from '@/lib/tools/crop-params';
import { cropImageUrlToFile } from '@/lib/image/crop-image-browser';

function initPortraitCropRect(imageWidth: number, imageHeight: number) {
  const size = Math.round(Math.min(imageWidth, imageHeight) * 0.42);
  const left = Math.round((imageWidth - size) / 2);
  const top = Math.round((imageHeight - size) * 0.22);
  return {
    left: Math.max(0, left),
    top: Math.max(0, top),
    width: Math.min(size, imageWidth),
    height: Math.min(size, imageHeight),
  };
}

interface PortraitCropStepProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  sourceFileName: string;
  onConfirm: (file: File) => void;
  onCancel: () => void;
}

export function PortraitCropStep({
  imageUrl,
  imageWidth,
  imageHeight,
  sourceFileName,
  onConfirm,
  onCancel,
}: PortraitCropStepProps) {
  const t = useTranslations('tool');
  const initialRect = useMemo(
    () => initPortraitCropRect(imageWidth, imageHeight),
    [imageWidth, imageHeight]
  );
  const [cropParams, setCropParams] = useState<CropParams>({
    ...DEFAULT_CROP_PARAMS,
    ...initialRect,
    aspectRatio: 'free',
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleConfirm = async () => {
    setIsExporting(true);
    try {
      const file = await cropImageUrlToFile(
        imageUrl,
        {
          left: cropParams.left,
          top: cropParams.top,
          width: cropParams.width,
          height: cropParams.height,
        },
        sourceFileName
      );
      onConfirm(file);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-secondary">{t('blurFacesPortraitCropHint')}</p>
      <CropEditor
        imageUrl={imageUrl}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        value={cropParams}
        onChange={setCropParams}
        compact
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={isExporting || cropParams.width < 1 || cropParams.height < 1}
          onClick={() => void handleConfirm()}
        >
          {isExporting ? t('blurFacesPortraitCropSaving') : t('blurFacesPortraitCropConfirm')}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          {t('blurFacesPortraitCropCancel')}
        </Button>
      </div>
    </div>
  );
}
