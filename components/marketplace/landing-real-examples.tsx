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
] as const;

export function LandingRealExamples() {
  const t = useTranslations('home');

  return (
    <section>
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-semibold text-text-primary mb-3">{t('examplesHeading')}</h2>
        <p className="text-text-secondary max-w-2xl mx-auto">{t('examplesSubheading')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {EXAMPLES.map((example) => (
          <article
            key={example.id}
            className="rounded-lg border border-border-default overflow-hidden bg-background-secondary/30"
          >
            <div className="grid grid-cols-2 gap-px bg-border-default">
              <div className="relative aspect-[4/3] bg-background-primary">
                <Image
                  src={example.beforeSrc}
                  alt={t(`example_${example.id}_before`)}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 200px"
                />
                <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                  {t('demoBefore')}
                </span>
              </div>
              <div className={`relative aspect-[4/3] ${'afterClassName' in example ? example.afterClassName : ''}`}>
                <Image
                  src={example.afterSrc}
                  alt={t(`example_${example.id}_after`)}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 200px"
                />
                <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                  {t('demoAfter')}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-medium text-text-primary mb-1">{t(`example_${example.id}_title`)}</h3>
              <p className="text-sm text-text-secondary">{t(`example_${example.id}_desc`)}</p>
              {'statKey' in example && example.statKey && (
                <p className="mt-2 text-xs font-medium text-accent">{t(example.statKey)}</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
