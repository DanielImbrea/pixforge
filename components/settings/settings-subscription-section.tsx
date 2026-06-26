import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import type { PlanTier } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ManageBillingButton } from '@/components/billing/manage-billing-button';
import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsSection } from '@/components/settings/settings-section';
import { cn } from '@/lib/utils/cn';

const planBadgeClass: Record<PlanTier, string> = {
  free: 'bg-background-tertiary text-text-secondary',
  basic: 'bg-accent/10 text-accent',
  starter: 'bg-accent/15 text-accent',
  pro: 'bg-success/10 text-success',
};

interface SettingsSubscriptionSectionProps {
  locale: Locale;
  plan: PlanTier;
  creditsRemaining: number;
  creditsLimit: number;
  renewalDate: string | null;
  hasStripeCustomer: boolean;
}

export async function SettingsSubscriptionSection({
  locale,
  plan,
  creditsRemaining,
  creditsLimit,
  renewalDate,
  hasStripeCustomer,
}: SettingsSubscriptionSectionProps) {
  const t = await getTranslations({ locale, namespace: 'settings' });
  const tPricing = await getTranslations({ locale, namespace: 'pricing' });
  const tDashboard = await getTranslations({ locale, namespace: 'dashboard' });

  return (
    <SettingsSection
      icon={CreditCard}
      title={t('subscriptionTitle')}
      description={t('subscriptionDescription')}
    >
      <SettingsRow label={t('subscriptionPlan')}>
        <Badge className={cn('capitalize', planBadgeClass[plan])}>{tPricing(plan)}</Badge>
      </SettingsRow>

      <SettingsRow label={t('creditsRemaining')}>
        <span className="text-sm font-medium text-text-primary">
          {creditsRemaining}{' '}
          <span className="font-normal text-text-tertiary">/ {creditsLimit}</span>
        </span>
      </SettingsRow>

      <SettingsRow label={t('nextRenewal')}>
        <span className="text-sm text-text-secondary">
          {renewalDate
            ? tDashboard('billingRenews', {
                date: new Date(renewalDate).toLocaleDateString(locale),
              })
            : t('noActiveSubscription')}
        </span>
      </SettingsRow>

      <SettingsRow label={t('manageSubscription')} border={false}>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          {hasStripeCustomer ? <ManageBillingButton label={t('manageSubscriptionButton')} /> : null}
          <Link href={`/${locale}/billing`}>
            <Button variant="secondary" size="sm">
              {t('billingHistoryButton')}
            </Button>
          </Link>
          {(plan === 'free' || plan === 'basic') && (
            <Link
              href={`/${locale}/pricing`}
              className="text-sm text-accent transition-colors hover:text-[color:var(--accent-hover)]"
            >
              {tDashboard('viewPlans')} →
            </Link>
          )}
        </div>
      </SettingsRow>
    </SettingsSection>
  );
}
