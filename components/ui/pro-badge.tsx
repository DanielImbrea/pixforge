'use client';

import { Crown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';

interface ProBadgeProps {
  className?: string;
  onClick?: () => void;
  title?: string;
}

export function ProBadge({ className, onClick, title }: ProBadgeProps) {
  const t = useTranslations('tool');

  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200/80',
        onClick && 'cursor-pointer hover:bg-amber-100 transition-colors',
        className
      )}
      title={title ?? t('downloadProBadgeHover')}
    >
      <Crown className="h-2.5 w-2.5" aria-hidden />
      PRO
    </span>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="shrink-0" aria-label={t('downloadProBadgeHover')}>
        {badge}
      </button>
    );
  }

  return badge;
}
