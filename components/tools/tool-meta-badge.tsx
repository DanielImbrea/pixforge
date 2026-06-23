import { getTranslations } from 'next-intl/server';
import type { ToolDefinition } from '@/types';
import type { Locale } from '@/i18n';

export async function ToolMetaBadge({ tool, locale }: { tool: ToolDefinition; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'tool' });
  const isAi = tool.type === 'ai';

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
          isAi ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-success/10 text-success border border-success/20'
        }`}
      >
        {isAi ? t('processorAi') : t('processorSharp')}
      </span>
      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-background-secondary text-text-secondary border border-border-default">
        {t('creditCost', { count: tool.creditsCost })}
      </span>
    </div>
  );
}
