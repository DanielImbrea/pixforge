import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';

const REASON_KEYS = ['speed', 'privacy', 'quality', 'aiSharp'] as const;

const REASON_EMOJI: Record<(typeof REASON_KEYS)[number], string> = {
  speed: '⚡',
  privacy: '🔒',
  quality: '🎯',
  aiSharp: '🧠',
};

export async function LandingWhy({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home' });

  return (
    <div>
      <div className="mb-10 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">{t('whyEyebrow')}</p>
        <h2 id="why-heading" className="mb-3 text-2xl font-semibold text-text-primary md:text-3xl">{t('whyTitle')}</h2>
        <p className="mx-auto max-w-2xl text-text-secondary">{t('whySubtitle')}</p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {REASON_KEYS.map((key) => (
          <article
            key={key}
            className="rounded-lg border border-border-default bg-background-secondary/50 p-6 transition-shadow hover:shadow-sm"
          >
            <p className="mb-3 text-2xl" aria-hidden="true">
              {REASON_EMOJI[key]}
            </p>
            <h3 className="mb-2 font-medium text-text-primary">{t(`why_${key}_title`)}</h3>
            <p className="text-sm text-text-secondary">{t(`why_${key}_body`)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
