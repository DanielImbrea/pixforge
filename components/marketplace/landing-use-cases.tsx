import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';

const USE_CASE_KEYS = ['ecommerce', 'social', 'photography', 'design', 'marketing', 'aiWorkflows'] as const;

const USE_CASE_EMOJI: Record<(typeof USE_CASE_KEYS)[number], string> = {
  ecommerce: '🛍️',
  social: '📱',
  photography: '📸',
  design: '🎨',
  marketing: '🏢',
  aiWorkflows: '🤖',
};

export async function LandingUseCases({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home' });

  return (
    <section aria-labelledby="use-cases-heading">
      <div className="mb-10 text-center">
        <h2 id="use-cases-heading" className="mb-3 text-2xl font-semibold text-text-primary md:text-3xl">
          {t('useCasesHeading')}
        </h2>
        <p className="mx-auto max-w-2xl text-text-secondary">{t('useCasesSubheading')}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {USE_CASE_KEYS.map((key) => (
          <article
            key={key}
            className="rounded-lg border border-border-default bg-background-secondary/40 px-4 py-5 text-center transition-colors hover:border-accent/40 hover:bg-background-secondary/70"
          >
            <p className="mb-2 text-2xl" aria-hidden="true">
              {USE_CASE_EMOJI[key]}
            </p>
            <h3 className="text-sm font-medium text-text-primary">{t(`useCase_${key}`)}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}
