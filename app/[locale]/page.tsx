import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { Locale } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';
import { LandingEcommercePresets } from '@/components/marketplace/landing-ecommerce-presets';
import { LandingBatchBg } from '@/components/marketplace/landing-batch-bg';
import { LandingDemoShowcase } from '@/components/marketplace/landing-demo-showcase';
import { LandingRealExamples } from '@/components/marketplace/landing-real-examples';
import { LandingKeywordStrip } from '@/components/marketplace/landing-popular-tools';
import { LandingToolGroups } from '@/components/marketplace/landing-tool-groups';
import { LandingWhy } from '@/components/marketplace/landing-why';
import { LandingUseCases } from '@/components/marketplace/landing-use-cases';
import { LandingTrustSection } from '@/components/marketplace/landing-trust';
import { LandingPricingPreview } from '@/components/marketplace/landing-pricing-preview';
import { SocialProof } from '@/components/marketplace/social-proof';
import { LandingFaq } from '@/components/marketplace/landing-faq';
import { Button } from '@/components/ui/button';
import { generateHomeMetadata } from '@/lib/seo/generate-metadata';
import { LANDING_FAQ_BY_LOCALE } from '@/lib/content/landing-faq';
import { generateHomeJsonLd } from '@/lib/seo/jsonld';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateHomeMetadata(locale);
}

const TESTIMONIALS_BY_LOCALE: Record<
  Locale,
  { quote: string; author: string; role: string; metric: string }[]
> = {
  en: [
    {
      metric: 'Saved ~2 hours/day on product photos',
      quote: 'Cut our product photo prep from an hour to a few minutes. Background removal plus compress is our daily workflow.',
      author: 'Maria T.',
      role: 'E-commerce store owner',
    },
    {
      metric: 'Rescued 120+ low-res client photos',
      quote: 'The AI upscaler restored sharpness and texture on photos we thought were unusable for print.',
      author: 'Daniel R.',
      role: 'Freelance designer',
    },
    {
      metric: '92% smaller files, same visual quality',
      quote: 'Smart format conversion and compression keep our blog fast without a manual Photoshop step.',
      author: 'Ana P.',
      role: 'Content creator',
    },
  ],
  ro: [
    {
      metric: 'Economisește ~2 ore/zi la poze de produs',
      quote: 'Ne-a redus pregătirea pozelor de la o oră la câteva minute. Eliminare fundal + compresie e rutina zilnică.',
      author: 'Maria T.',
      role: 'Proprietar magazin online',
    },
    {
      metric: '120+ poze low-res salvate pentru clienți',
      quote: 'Upscalerul AI a restaurat claritatea și textura pozelor pe care le credeam inutilizabile la print.',
      author: 'Daniel R.',
      role: 'Designer freelancer',
    },
    {
      metric: 'Fișiere cu 92% mai mici, aceeași calitate vizuală',
      quote: 'Conversia inteligentă de format și compresia țin blogul rapid fără pas manual în Photoshop.',
      author: 'Ana P.',
      role: 'Creator de conținut',
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
  const testimonials = TESTIMONIALS_BY_LOCALE[locale];
  const faqItems = LANDING_FAQ_BY_LOCALE[locale];
  const homeJsonLd = generateHomeJsonLd(locale, faqItems);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <div>
      <section className="max-w-5xl mx-auto px-6 py-20 md:py-28 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-4">{t('heroEyebrow')}</p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-text-primary mb-5 text-balance">
          {t('heroTitle')}
        </h1>
        <p className="text-lg md:text-xl text-text-secondary mb-6 max-w-3xl mx-auto text-balance">
          {t('heroSubtitle')}
        </p>
        <LandingKeywordStrip locale={locale} />
        <p className="text-sm text-text-tertiary mb-8">{t('heroProof')}</p>
        <div className="flex flex-col items-center justify-center gap-4">
          <Link href={`/${locale}/auth/signup`}>
            <Button size="lg" className="min-w-[200px] shadow-sm">
              {t('ctaPrimary')}
            </Button>
          </Link>
          <Link
            href={`/${locale}/tools`}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            {t('ctaSecondary')}
          </Link>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-2 text-center">{t('demoHeading')}</h2>
        <p className="text-sm text-text-secondary mb-8 text-center max-w-2xl mx-auto">{t('demoSubheading')}</p>
        <LandingDemoShowcase />
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border-default" aria-labelledby="examples-heading">
        <LandingRealExamples />
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16 border-t border-border-default">
        <LandingBatchBg locale={locale} />
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border-default">
        <LandingEcommercePresets locale={locale} />
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border-default" aria-labelledby="why-heading">
        <LandingWhy locale={locale} />
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border-default">
        <LandingUseCases locale={locale} />
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border-default" aria-labelledby="tools-heading">
        <div className="text-center mb-12">
          <h2 id="tools-heading" className="text-2xl md:text-3xl font-semibold text-text-primary mb-3">{t('toolsHeading')}</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">{t('toolsSubheading')}</p>
        </div>
        <LandingToolGroups locale={locale} />
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border-default" aria-labelledby="trust-heading">
        <LandingTrustSection locale={locale} />
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <LandingPricingPreview locale={locale} />
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold text-text-primary mb-8 text-center">{t('socialProofHeading')}</h2>
        <SocialProof testimonials={testimonials} />
      </section>

      <section id="faq" className="max-w-3xl mx-auto px-6 py-16 border-t border-border-default">
        <h2 className="text-2xl font-semibold text-text-primary mb-2 text-center">{t('faqHeading')}</h2>
        <p className="text-sm text-text-secondary mb-8 text-center max-w-2xl mx-auto">{t('faqSubheading')}</p>
        <LandingFaq items={faqItems} />
      </section>

      <section className="max-w-3xl mx-auto px-6 py-12 md:py-16 text-center border-t border-border-default">
        <h2 className="text-2xl md:text-3xl font-semibold text-text-primary mb-3 text-balance">{t('finalCtaTitle')}</h2>
        <p className="text-text-secondary mb-6 md:mb-8">{t('finalCtaSubtitle')}</p>
        <Link href={`/${locale}/auth/signup`}>
          <Button size="lg">{t('ctaPrimary')}</Button>
        </Link>
      </section>
    </div>
    </>
  );
}
