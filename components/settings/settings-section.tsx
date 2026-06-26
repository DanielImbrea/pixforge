import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

interface SettingsSectionProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({ icon: Icon, title, description, children, className }: SettingsSectionProps) {
  return (
    <Card
      className={cn(
        'transition-colors hover:border-[color:var(--border-strong)]/60',
        className
      )}
    >
      <div className="mb-6 flex items-start gap-3">
        <div className="rounded-lg border border-border-default bg-background-secondary p-2.5">
          <Icon className="h-4 w-4 text-text-secondary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          {description ? <p className="mt-1 text-sm text-text-secondary">{description}</p> : null}
        </div>
      </div>
      <div className="space-y-1">{children}</div>
    </Card>
  );
}
