import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none',
  {
    variants: {
      variant: {
        primary:
          'cursor-pointer bg-accent text-white shadow-sm hover:bg-accent-hover hover:shadow-md active:scale-[0.99] font-semibold',
        secondary:
          'cursor-pointer bg-background-secondary text-text-primary border border-border-default hover:border-border-strong hover:bg-background-tertiary',
        ghost:
          'cursor-pointer text-text-secondary hover:text-text-primary hover:bg-background-secondary',
        danger: 'cursor-pointer bg-danger text-white shadow-sm hover:opacity-90 hover:shadow-md',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  }
);

Button.displayName = 'Button';
