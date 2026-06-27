import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { getToolById } from '@/lib/tools/registry';
import { LANDING_HERO_TOOLS, type LandingHeroToolKey } from '@/lib/tools/landing-tools';

export async function LandingKeywordStrip({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home' });

  return (
    <nav
      aria-label={t('heroToolsAriaLabel')}
      className="mb-8 flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-sm text-text-secondary"
    >
      {LANDING_HERO_TOOLS.map((item, index) => {
        const tool = getToolById(item.id);
        if (!tool) return null;
        return (
          <span key={`${item.id}-${item.key}`} className="inline-flex items-center gap-1">
            {index > 0 ? (
              <span className="mx-1 text-text-tertiary" aria-hidden="true">
                •
              </span>
            ) : null}
            <Link
              href={`/${locale}/${tool.slug[locale]}`}
              className="hover:text-accent underline-offset-4 transition-colors hover:underline"
            >
              {t(`heroTool_${item.key}` as `heroTool_${LandingHeroToolKey}`)}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
