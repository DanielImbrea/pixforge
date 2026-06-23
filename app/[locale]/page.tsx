import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { Locale } from '@/i18n';
import { getEnabledTools } from '@/lib/tools/registry';
import { PLAN_LIMITS, PLAN_ORDER, formatPlanPrice } from '@/lib/billing/plans';
import { getCurrentUser } from '@/lib/supabase/server';
import { ToolCard } from '@/components/marketplace/tool-card';
import { BeforeAfterSlider } from '@/components/marketplace/before-after-slider';
import { SocialProof } from '@/components/marketplace/social-proof';
import { LandingFaq } from '@/components/marketplace/landing-faq';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { generateHomeMetadata } from '@/lib/seo/generate-metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateHomeMetadata(locale);
}

const TESTIMONIALS_BY_LOCALE: Record<Locale, { quote: string; author: string; role: string }[]> = {
  en: [
    {
      quote: 'Cut our product photo prep time from an hour to a few minutes.',
      author: 'Maria T.',
      role: 'E-commerce store owner',
    },
    {
      quote: 'The upscaler saved a batch of low-res client photos we thought were unusable.',
      author: 'Daniel R.',
      role: 'Freelance designer',
    },
    {
      quote: 'Simple, fast, and the free tier is genuinely useful, not just a teaser.',
      author: 'Ana P.',
      role: 'Content creator',
    },
  ],
  ro: [
    {
      quote: 'Ne-a redus timpul de pregătire a pozelor de produs de la o oră la câteva minute.',
      author: 'Maria T.',
      role: 'Proprietar magazin online',
    },
    {
      quote: 'Upscalerul a salvat un lot de poze de la clienți pe care le credeam inutilizabile.',
      author: 'Daniel R.',
      role: 'Designer freelancer',
    },
    {
      quote: 'Simplu, rapid, iar planul gratuit este cu adevărat util, nu doar un teaser.',
      author: 'Ana P.',
      role: 'Creator de conținut',
    },
  ],
};

const LANDING_FAQ_BY_LOCALE: Record<Locale, { question: string; answer: string }[]> = {
  en: [
    {
      question: 'Do I need to install anything?',
      answer: 'No, every tool runs entirely in your browser tab. Nothing to download or install.',
    },
    {
      question: 'Is the free plan really free?',
      answer: 'Yes. You get 3 processes per day with no credit card required, forever.',
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, manage or cancel your subscription anytime from the billing page.',
    },
    {
      question: 'Do you support batch processing?',
      answer: 'Batch processing is available on the Pro plan.',
    },
  ],
  ro: [
    {
      question: 'Trebuie să instalez ceva?',
      answer: 'Nu, fiecare unealtă rulează complet în browser. Nimic de descărcat sau instalat.',
    },
    {
      question: 'Planul gratuit este cu adevărat gratuit?',
      answer: 'Da. Primești 3 procesări pe zi fără card bancar, pe termen nelimitat.',
    },
    {
      question: 'Pot anula oricând?',
      answer: 'Da, gestionează sau anulează abonamentul oricând din pagina de facturare.',
    },
    {
      question: 'Susțineți procesare în lot?',
      answer: 'Procesarea în lot este disponibilă pe planul Pro.',
    },
  ],
};

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (user) {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations({ locale, namespace: 'home' });
  const tPricing = await getTranslations({ locale, namespace: 'pricing' });
  const tools = getEnabledTools();
  const testimonials = TESTIMONIALS_BY_LOCALE[locale];
  const faqItems = LANDING_FAQ_BY_LOCALE[locale];

  return (
    <div>
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-semibold text-text-primary mb-4">{t('heroTitle')}</h1>
        <p className="text-lg text-text-secondary mb-8">{t('heroSubtitle')}</p>
        <div className="flex items-center justify-center gap-3">
          <Link href={`/${locale}/auth/signup`}>
            <Button size="lg">{t('ctaPrimary')}</Button>
          </Link>
          <Link href={`/${locale}/tools`}>
            <Button variant="secondary" size="lg">
              {t('ctaSecondary')}
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold text-text-primary mb-6 text-center">
          {locale === 'ro' ? 'Vezi rezultatul' : 'See the result'}
        </h2>
        <BeforeAfterSlider
          beforeSrc="https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&q=40&blur=40"
          afterSrc="https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=1600&q=90"
          beforeLabel={locale === 'ro' ? 'Înainte' : 'Before'}
          afterLabel={locale === 'ro' ? 'După' : 'After'}
        />
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold text-text-primary mb-8 text-center">{t('toolsHeading')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} locale={locale} />
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        {[
          {
            title: locale === 'ro' ? 'Rapid' : 'Fast',
            body:
              locale === 'ro'
                ? 'Procesare în câteva secunde, fără cozi de așteptare lungi.'
                : 'Processing finishes in seconds, no long waiting queues.',
          },
          {
            title: locale === 'ro' ? 'Calitate' : 'Quality',
            body:
              locale === 'ro'
                ? 'Algoritmi optimizați care păstrează detaliile imaginii.'
                : 'Optimized algorithms that preserve image detail.',
          },
          {
            title: locale === 'ro' ? 'Simplitate' : 'Simplicity',
            body:
              locale === 'ro'
                ? 'Fără curbă de învățare, încarcă și descarcă.'
                : 'No learning curve, just upload and download.',
          },
        ].map((b) => (
          <div key={b.title}>
            <p className="font-medium text-text-primary mb-2">{b.title}</p>
            <p className="text-sm text-text-secondary">{b.body}</p>
          </div>
        ))}
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold text-text-primary mb-8 text-center">{tPricing('heading')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {PLAN_ORDER.map((tier) => {
            const config = PLAN_LIMITS[tier];
            return (
              <Card key={tier}>
                <h3 className="text-lg font-medium text-text-primary mb-1">{tPricing(tier)}</h3>
                <p className="text-2xl font-semibold text-text-primary mb-4">
                  {formatPlanPrice(config, locale)}
                  {config.price.amount > 0 && (
                    <span className="text-sm text-text-tertiary">{tPricing('perMonth')}</span>
                  )}
                </p>
                <p className="text-sm text-text-secondary">
                  {config.periodType === 'daily'
                    ? tPricing('creditsPerDay', { count: config.creditsPerPeriod })
                    : tPricing('creditsPerMonth', { count: config.creditsPerPeriod })}
                </p>
              </Card>
            );
          })}
        </div>
        <div className="text-center mt-8">
          <Link href={`/${locale}/pricing`}>
            <Button variant="secondary">{tPricing('heading')}</Button>
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <SocialProof testimonials={testimonials} />
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold text-text-primary mb-8 text-center">FAQ</h2>
        <LandingFaq items={faqItems} />
      </section>

      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-semibold text-text-primary mb-4">{t('heroTitle')}</h2>
        <Link href={`/${locale}/auth/signup`}>
          <Button size="lg">{t('ctaPrimary')}</Button>
        </Link>
      </section>
    </div>
  );
}
