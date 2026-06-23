import type { Locale } from '@/i18n';
import type { PlanTier, ToolDefinition } from '@/types';
import { getCurrentUser } from '@/lib/supabase/server';
import { ToolInteractive } from './tool-interactive';
import { ToolFaq } from './tool-faq';
import { ToolMetaBadge } from './tool-meta-badge';

export async function ToolPage({ tool, locale }: { tool: ToolDefinition; locale: Locale }) {
  const copy = tool.seo.translations[locale];
  const user = await getCurrentUser();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold text-text-primary mb-3">{copy.h1}</h1>
      <ToolMetaBadge tool={tool} locale={locale} />
      <p className="text-text-secondary mb-10">{copy.intro}</p>

      <ToolInteractive tool={tool} userPlan={user?.plan ?? null} />

      <section className="mt-16">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Benefits</h2>
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
        <h2 className="text-xl font-semibold text-text-primary mb-4">FAQ</h2>
        <ToolFaq items={copy.faq} />
      </section>
    </div>
  );
}
