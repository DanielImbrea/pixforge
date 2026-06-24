import type { Locale } from '@/i18n';
import { groupToolsForLanding } from '@/lib/tools/tool-groups';
import { getEnabledTools } from '@/lib/tools/registry';
import { getTranslations } from 'next-intl/server';
import { ToolCard } from './tool-card';

export async function LandingToolGroups({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const groups = groupToolsForLanding(getEnabledTools());

  return (
    <div className="space-y-12">
      {groups.map((group) => (
        <div key={group.id}>
          <div className="mb-6 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-1">
              {t(`toolGroup_${group.id}_label`)}
            </p>
            <h3 className="text-xl font-semibold text-text-primary">{t(`toolGroup_${group.id}_title`)}</h3>
            <p className="text-sm text-text-secondary mt-1 max-w-2xl">{t(`toolGroup_${group.id}_desc`)}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {group.tools.map((tool) => {
              const isAi = tool.type === 'ai';
              return (
              <ToolCard
                key={tool.id}
                tool={tool}
                locale={locale}
                description={t(`toolCard_${tool.id}` as 'toolCard_tool_resize')}
                badgeLabel={tool.badge ? t(`badge_${tool.badge}` as 'badge_popular') : undefined}
                aiBadge={isAi ? t('aiPoweredBadge') : undefined}
                featured={group.id === 'enhance' && tool.badge === 'popular'}
              />
            );})}
          </div>
        </div>
      ))}
    </div>
  );
}
