import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface SettingsRowProps {
  label: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  border?: boolean;
}

export function SettingsRow({ label, description, children, className, border = true }: SettingsRowProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between',
        border && 'border-t border-border-default first:border-t-0 first:pt-0 last:pb-0',
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description ? <p className="mt-0.5 text-sm text-text-secondary">{description}</p> : null}
      </div>
      {children ? <div className="shrink-0 sm:pl-4">{children}</div> : null}
    </div>
  );
}
