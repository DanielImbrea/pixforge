import type { Locale } from '@/i18n';
import { getLandingToolsOrdered } from '@/lib/tools/landing-tools';
import { getTranslations } from 'next-intl/server';
import { ToolCard } from './tool-card';

export async function LandingToolGroups({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const tools = getLandingToolsOrdered();

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {tools.map((tool) => {
        const isAi = tool.type === 'ai';
        return (
          <ToolCard
            key={tool.id}
            tool={tool}
            locale={locale}
            description={t(`toolCard_${tool.id}` as 'toolCard_tool_resize')}
            badgeLabel={tool.badge ? t(`badge_${tool.badge}` as 'badge_popular') : undefined}
            typeBadge={isAi ? t('badgeAi') : t('badgeInstant')}
            featured={tool.badge === 'popular'}
          />
        );
      })}
    </div>
  );
}
