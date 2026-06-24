import Link from 'next/link';
import type { Locale } from '@/i18n';
import type { ToolDefinition } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getToolIcon } from '@/lib/tools/icon-map';
import { cn } from '@/lib/utils/cn';

interface ToolCardProps {
  tool: ToolDefinition;
  locale: Locale;
  description?: string;
  badgeLabel?: string;
  aiBadge?: string;
  featured?: boolean;
}

export function ToolCard({
  tool,
  locale,
  description,
  badgeLabel,
  aiBadge,
  featured = false,
}: ToolCardProps) {
  const copy = tool.seo.translations[locale];
  const Icon = getToolIcon(tool.icon);
  const isAi = tool.type === 'ai';

  return (
    <Link href={`/${locale}/${tool.slug[locale]}`}>
      <Card
        className={cn(
          'h-full hover:border-border-strong transition-colors',
          featured && 'border-accent/40 bg-accent/[0.03]'
        )}
      >
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon size={18} className={cn('shrink-0', isAi ? 'text-accent' : 'text-text-secondary')} />
            <h3 className="font-medium text-text-primary truncate">{tool.name[locale]}</h3>
          </div>
          {badgeLabel && <Badge className="shrink-0">{badgeLabel}</Badge>}
        </div>
        <p className="text-sm text-text-secondary line-clamp-3">
          {description || copy.intro}
        </p>
        {isAi && aiBadge && (
          <p className="mt-3 text-xs font-medium text-accent">{aiBadge}</p>
        )}
      </Card>
    </Link>
  );
}
