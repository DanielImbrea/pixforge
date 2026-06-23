import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-md border border-border-default bg-background-primary px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
