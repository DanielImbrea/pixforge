import Link from 'next/link';
import type { Locale } from '@/i18n';
import type { ToolDefinition } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getToolIcon } from '@/lib/tools/icon-map';

export function ToolCard({ tool, locale }: { tool: ToolDefinition; locale: Locale }) {
  const copy = tool.seo.translations[locale];
  const Icon = getToolIcon(tool.icon);

  return (
    <Link href={`/${locale}/${tool.slug[locale]}`}>
      <Card className="h-full hover:border-border-strong transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon size={18} className="text-accent" />
            <h3 className="font-medium text-text-primary">{tool.name[locale]}</h3>
          </div>
          {tool.badge && <Badge>{tool.badge}</Badge>}
        </div>
        <p className="text-sm text-text-secondary line-clamp-2">{copy.intro}</p>
      </Card>
    </Link>
  );
}
