import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';

const REASON_KEYS = ['routing', 'quality', 'speed'] as const;

export async function LandingWhy({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home' });

  return (
    <section>
      <div className="text-center mb-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-2">{t('whyEyebrow')}</p>
        <h2 className="text-2xl md:text-3xl font-semibold text-text-primary mb-3">{t('whyTitle')}</h2>
        <p className="text-text-secondary max-w-2xl mx-auto">{t('whySubtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {REASON_KEYS.map((key) => (
          <div
            key={key}
            className="rounded-lg border border-border-default bg-background-secondary/50 p-6"
          >
            <h3 className="font-medium text-text-primary mb-2">{t(`why_${key}_title`)}</h3>
            <p className="text-sm text-text-secondary">{t(`why_${key}_body`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
