import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PLAN_LIMITS } from '@/lib/billing/plans';
import { Card } from '@/components/ui/card';
import { ManageBillingButton } from '@/components/billing/manage-billing-button';

export default async function BillingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  const tPricing = await getTranslations({ locale, namespace: 'pricing' });
  const user = await getCurrentUser();

  if (!user) return null;

  const admin = createAdminClient();
  const { data: subscription } = await admin
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  const planConfig = PLAN_LIMITS[user.plan];
  const creditsLabel =
    planConfig.periodType === 'daily'
      ? tPricing('creditsPerDay', { count: planConfig.creditsPerPeriod })
      : tPricing('creditsPerMonth', { count: planConfig.creditsPerPeriod });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-text-primary mb-6">{t('billing')}</h1>
      <Card className="max-w-md">
        <p className="text-sm text-text-secondary mb-1">{t('billingCurrentPlan')}</p>
        <p className="text-xl font-semibold text-text-primary mb-4 capitalize">{user.plan}</p>
        <p className="text-sm text-text-tertiary mb-2">{creditsLabel}</p>
        <p className="text-sm text-text-tertiary mb-4">
          {tPricing('maxUploadPerFile', { mb: planConfig.maxUploadMB })}
        </p>
        {subscription && (
          <p className="text-sm text-text-tertiary mb-4">
            {t('billingRenews', {
              date: new Date(subscription.current_period_end).toLocaleDateString(locale),
            })}
          </p>
        )}
        {(user.plan === 'free' || user.plan === 'basic') && (
          <Link
            href={`/${locale}/pricing`}
            className="text-sm text-accent hover:text-[color:var(--accent-hover)] transition-colors"
          >
            {t('viewPlans')} →
          </Link>
        )}
        {user.stripe_customer_id && (
          <div className={user.plan === 'free' ? 'mt-4' : ''}>
            <ManageBillingButton />
          </div>
        )}
      </Card>
    </div>
  );
}
