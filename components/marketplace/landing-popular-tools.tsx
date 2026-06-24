import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { getToolById } from '@/lib/tools/registry';

const POPULAR_TOOL_IDS = [
  'tool_upscale_ai',
  'tool_background_removal',
  'tool_compress',
  'tool_convert',
] as const;

type PopularToolKey = 'upscale' | 'background' | 'compress' | 'convert';

const TOOL_KEY_MAP: Record<(typeof POPULAR_TOOL_IDS)[number], PopularToolKey> = {
  tool_upscale_ai: 'upscale',
  tool_background_removal: 'background',
  tool_compress: 'compress',
  tool_convert: 'convert',
};

export async function LandingKeywordStrip({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const tools = POPULAR_TOOL_IDS.map((id) => getToolById(id)).filter(Boolean);

  return (
    <nav
      aria-label={t('popularToolsHeading')}
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-text-secondary mb-8"
    >
      {tools.map((tool, index) => {
        const key = TOOL_KEY_MAP[tool!.id as (typeof POPULAR_TOOL_IDS)[number]];
        return (
          <span key={tool!.id} className="inline-flex items-center gap-2">
            {index > 0 ? <span className="text-text-tertiary hidden sm:inline" aria-hidden="true">•</span> : null}
            <Link
              href={`/${locale}/${tool!.slug[locale]}`}
              className="hover:text-accent transition-colors underline-offset-4 hover:underline"
            >
              {t(`popularTool_${key}` as 'popularTool_upscale')}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}

export async function LandingPopularTools({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const tools = POPULAR_TOOL_IDS.map((id) => getToolById(id)).filter(Boolean);

  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <h2 className="text-xl font-semibold text-text-primary mb-6 text-center">{t('popularToolsHeading')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tools.map((tool) => {
          const key = TOOL_KEY_MAP[tool!.id as (typeof POPULAR_TOOL_IDS)[number]];
          return (
            <Link
              key={tool!.id}
              href={`/${locale}/${tool!.slug[locale]}`}
              className="rounded-lg border border-border-default bg-background-secondary/40 px-4 py-3 text-sm font-medium text-text-primary hover:border-accent hover:text-accent transition-colors text-center"
            >
              {t(`popularTool_${key}` as 'popularTool_upscale')}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
