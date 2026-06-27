'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

const EXAMPLES = [
  {
    id: 'background',
    beforeSrc: '/demo/bg-removal-before.jpg',
    afterSrc: '/demo/bg-removal-after2.png',
    afterClassName: 'bg-white',
  },
  {
    id: 'upscale',
    beforeSrc:
      'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=400&q=40&blur=40',
    afterSrc: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&q=90',
  },
  {
    id: 'compress',
    beforeSrc:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=95',
    afterSrc:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=72',
    statKey: 'example_compress_stat' as const,
  },
  {
    id: 'blur_faces',
    beforeSrc: '/demo/blur-faces-before.png',
    afterSrc: '/demo/blur-faces-after.png',
  },
] as const;

export function LandingRealExamples() {
  const t = useTranslations('home');

  return (
    <div>
      <div className="mb-10 text-center">
        <h2 id="examples-heading" className="mb-3 text-2xl font-semibold text-text-primary md:text-3xl">{t('examplesHeading')}</h2>
        <p className="mx-auto max-w-2xl text-text-secondary">{t('examplesSubheading')}</p>
      </div>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        {EXAMPLES.map((example) => (
          <article
            key={example.id}
            className="overflow-hidden rounded-lg border border-border-default bg-background-secondary/30"
          >
            <div className="grid grid-cols-2 gap-px bg-border-default">
              <div className="relative aspect-[4/3] bg-background-primary">
                <Image
                  src={example.beforeSrc}
                  alt={t(`example_${example.id}_before`)}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 420px"
                />
                <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                  {t('demoBefore')}
                </span>
              </div>
              <div
                className={`relative aspect-[4/3] ${'afterClassName' in example ? example.afterClassName : 'bg-background-primary'}`}
              >
                <Image
                  src={example.afterSrc}
                  alt={t(`example_${example.id}_after`)}
                  fill
                  className={`object-cover ${'afterImageClassName' in example ? example.afterImageClassName : ''}`}
                  sizes="(max-width: 768px) 50vw, 420px"
                />
                <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                  {t('demoAfter')}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="mb-1 font-medium text-text-primary">{t(`example_${example.id}_title`)}</h3>
              <p className="text-sm text-text-secondary">{t(`example_${example.id}_desc`)}</p>
              {'statKey' in example && example.statKey && (
                <p className="mt-2 text-xs font-medium text-accent">{t(example.statKey)}</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
