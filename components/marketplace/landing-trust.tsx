import { Shield, Lock, Trash2, Globe } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';

const TRUST_KEYS = ['retention', 'noTraining', 'https', 'euStorage'] as const;

const TRUST_ICONS = {
  retention: Trash2,
  noTraining: Shield,
  https: Lock,
  euStorage: Globe,
} as const;

export async function LandingTrustSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home' });

  return (
    <section className="rounded-xl border border-border-default bg-background-secondary/40 p-8 md:p-10">
      <div className="text-center mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-2">{t('trustEyebrow')}</p>
        <h2 id="trust-heading" className="text-2xl md:text-3xl font-semibold text-text-primary mb-3">{t('trustTitle')}</h2>
        <p className="text-text-secondary max-w-2xl mx-auto">{t('trustSubtitle')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {TRUST_KEYS.map((key) => {
          const Icon = TRUST_ICONS[key];
          return (
            <div key={key} className="flex gap-4 rounded-lg border border-border-default bg-background-primary p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h3 className="font-medium text-text-primary mb-1">{t(`trust_${key}_title`)}</h3>
                <p className="text-sm text-text-secondary">{t(`trust_${key}_body`)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
