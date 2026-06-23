'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { PlanTier } from '@/types';

interface UpgradePromptProps {
  plan: PlanTier;
  locale: string;
}

export function UpgradePrompt({ plan, locale }: UpgradePromptProps) {
  const t = useTranslations('dashboard');

  if (plan !== 'free' && plan !== 'basic') return null;

  return (
    <Card className="border-accent/30 bg-accent/5">
      <p className="text-sm font-medium text-text-primary mb-1">{t('upgradeTitle')}</p>
      <p className="text-sm text-text-secondary mb-4">{t('upgradeBody')}</p>
      <Link href={`/${locale}/pricing`}>
        <Button variant="primary" size="sm">
          {t('viewPlans')}
        </Button>
      </Link>
    </Card>
  );
}
