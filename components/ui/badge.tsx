import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent',
        className
      )}
      {...props}
    />
  );
}
