'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BeforeAfterSlider } from './before-after-slider';
import { cn } from '@/lib/utils/cn';

type DemoTab = 'upscale' | 'background' | 'compress';

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
  compress: {
    beforeSrc:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=95',
    afterSrc:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&q=72',
    stat: { before: '2.4 MB', after: '186 KB', reduction: '−92%' },
  },
};

export function LandingDemoShowcase() {
  const t = useTranslations('home');
  const [activeTab, setActiveTab] = useState<DemoTab>('upscale');
  const demo = DEMOS[activeTab];

  const tabs: { id: DemoTab; labelKey: 'demoTabUpscale' | 'demoTabBackground' | 'demoTabCompress' }[] =
    [
      { id: 'upscale', labelKey: 'demoTabUpscale' },
      { id: 'background', labelKey: 'demoTabBackground' },
      { id: 'compress', labelKey: 'demoTabCompress' },
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
