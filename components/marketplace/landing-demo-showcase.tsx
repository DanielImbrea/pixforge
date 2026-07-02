'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BeforeAfterSlider } from './before-after-slider';
import { cn } from '@/lib/utils/cn';

type DemoTab = 'upscale' | 'background' | 'portrait' | 'compress' | 'blur_faces';

const DEMOS: Record<
  DemoTab,
  {
    beforeSrc: string;
    afterSrc: string;
    afterBackground?: 'white' | 'checkerboard';
    afterObjectFit?: 'cover' | 'contain';
    stat?: { before: string; after: string; reduction: string };
  }
> = {
  upscale: {
    beforeSrc:
      'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&q=40&blur=40',
    afterSrc: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=1600&q=90',
  },
  background: {
    beforeSrc: '/demo/bg-removal-before.jpg',
    afterSrc: '/demo/bg-removal-after2.png',
    afterBackground: 'white',
    afterObjectFit: 'cover',
  },
  portrait: {
    beforeSrc: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1400&q=45&blur=5&sat=-18&con=-10&bri=-3',
    afterSrc: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1400&q=92',
  },
  compress: {
    beforeSrc: '/demo/compress-before.jpg',
    afterSrc: '/demo/compress-after.jpg',
    stat: { before: '3 MB', after: '300 KB', reduction: '−90%' },
  },
  blur_faces: {
    beforeSrc: '/demo/blur-faces-before.png',
    afterSrc: '/demo/blur-faces-after.png',
  },
};

export function LandingDemoShowcase() {
  const t = useTranslations('home');
  const [activeTab, setActiveTab] = useState<DemoTab>('upscale');
  const demo = DEMOS[activeTab];

  const tabs: {
    id: DemoTab;
    labelKey:
      | 'demoTabUpscale'
      | 'demoTabBackground'
      | 'demoTabPortrait'
      | 'demoTabCompress'
      | 'demoTabBlurFaces';
  }[] = [
    { id: 'upscale', labelKey: 'demoTabUpscale' },
    { id: 'background', labelKey: 'demoTabBackground' },
    { id: 'portrait', labelKey: 'demoTabPortrait' },
    { id: 'compress', labelKey: 'demoTabCompress' },
    { id: 'blur_faces', labelKey: 'demoTabBlurFaces' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary'
            )}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <p className="text-center text-sm text-text-secondary">{t(`demoCaption_${activeTab}`)}</p>

      <BeforeAfterSlider
        beforeSrc={demo.beforeSrc}
        afterSrc={demo.afterSrc}
        beforeLabel={t('demoBefore')}
        afterLabel={t('demoAfter')}
        afterBackground={demo.afterBackground}
        afterObjectFit={demo.afterObjectFit}
      />

      {demo.stat && (
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <span className="rounded-md border border-border-default bg-background-secondary px-3 py-2 text-text-secondary">
            {t('demoSizeBefore', { size: demo.stat.before })}
          </span>
          <span className="text-text-tertiary">→</span>
          <span className="rounded-md border border-border-default bg-background-secondary px-3 py-2 text-text-primary font-medium">
            {t('demoSizeAfter', { size: demo.stat.after })}
          </span>
          <span className="rounded-md border border-success/30 bg-success/5 px-3 py-2 text-success font-medium">
            {demo.stat.reduction}
          </span>
        </div>
      )}
    </div>
  );
}
