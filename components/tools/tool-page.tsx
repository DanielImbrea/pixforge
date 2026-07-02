import { Suspense } from 'react';
import type { Locale } from '@/i18n';
import type { ToolDefinition } from '@/types';
import { getSeoSectionLabels } from '@/lib/seo/tool-sections';
import { getCurrentUser } from '@/lib/supabase/server';
import { ToolInteractive } from './tool-interactive';
import { ToolFaq } from './tool-faq';
import { ToolMetaBadge } from './tool-meta-badge';

export async function ToolPage({ tool, locale }: { tool: ToolDefinition; locale: Locale }) {
  const copy = tool.seo.translations[locale];
  const labels = getSeoSectionLabels(locale);
  const user = await getCurrentUser();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold text-text-primary mb-3">{copy.h1}</h1>
      <ToolMetaBadge tool={tool} locale={locale} />
      <p className="text-text-secondary mb-10">{copy.intro}</p>

      <Suspense fallback={<div className="min-h-[320px] rounded-lg border border-border-default bg-background-secondary/30 animate-pulse" />}>
        <ToolInteractive tool={tool} userPlan={user?.plan ?? null} />
      </Suspense>

      {copy.howItWorks ? (
        <section className="mt-16">
          <h2 className="text-xl font-semibold text-text-primary mb-4">{labels.howItWorks}</h2>
          <p className="text-sm text-text-secondary leading-relaxed">{copy.howItWorks}</p>
        </section>
      ) : null}

      {copy.bestFor?.length ? (
        <section className="mt-16">
          <h2 className="text-xl font-semibold text-text-primary mb-4">{labels.bestFor}</h2>
          <ul className="space-y-2">
            {copy.bestFor.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-success mt-0.5">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {copy.aiExplanation?.length ? (
        <section className="mt-16">
          <h2 className="text-xl font-semibold text-text-primary mb-4">{labels.aiExplanation}</h2>
          <ul className="space-y-2">
            {copy.aiExplanation.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-accent mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {copy.useCases?.length ? (
        <section className="mt-16">
          <h2 className="text-xl font-semibold text-text-primary mb-4">{labels.useCases}</h2>
          <ul className="space-y-2">
            {copy.useCases.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-success mt-0.5">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-16">
        <h2 className="text-xl font-semibold text-text-primary mb-4">{labels.benefits}</h2>
        <ul className="space-y-2">
          {copy.benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2 text-sm text-text-secondary">
              <span className="text-success mt-0.5">✓</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="text-xl font-semibold text-text-primary mb-4">{labels.faq}</h2>
        <ToolFaq items={copy.faq} />
      </section>
    </div>
  );
}
