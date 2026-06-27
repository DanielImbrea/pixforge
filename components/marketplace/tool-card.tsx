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
  typeBadge?: string;
  featured?: boolean;
}

export function ToolCard({
  tool,
  locale,
  description,
  badgeLabel,
  typeBadge,
  featured = false,
}: ToolCardProps) {
  const copy = tool.seo.translations[locale];
  const Icon = getToolIcon(tool.icon);
  const isAi = tool.type === 'ai';

  return (
    <Link
      href={`/${locale}/${tool.slug[locale]}`}
      className="group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <Card
        className={cn(
          'flex h-full flex-col transition-all duration-200 group-hover:-translate-y-1 group-hover:border-accent/50 group-hover:shadow-md',
          featured && 'border-accent/40 bg-accent/[0.03]'
        )}
      >
        <div className="mb-3 flex items-start gap-2">
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background-secondary transition-colors group-hover:bg-accent/10',
              isAi ? 'text-accent' : 'text-text-secondary'
            )}
          >
            <Icon size={18} aria-hidden />
          </div>
          <h3 className="flex min-h-9 min-w-0 flex-1 items-center font-medium leading-snug text-text-primary">
            {tool.name[locale]}
          </h3>
        </div>
        <p className="flex-1 text-sm text-text-secondary line-clamp-3">{description || copy.intro}</p>
        {(typeBadge || badgeLabel) && (
          <div className="mt-3 flex flex-wrap items-center justify-end gap-1.5">
            {typeBadge && (
              <Badge className={cn('text-[10px] uppercase tracking-wide', isAi ? '' : 'bg-background-secondary text-text-secondary')}>
                {typeBadge}
              </Badge>
            )}
            {badgeLabel && (
              <Badge className="border border-border-default bg-transparent text-text-secondary">
                {badgeLabel}
              </Badge>
            )}
          </div>
        )}
      </Card>
    </Link>
  );
}
