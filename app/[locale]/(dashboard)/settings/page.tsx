import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPeriodStartForPlan } from '@/lib/billing/plans';
import { getCreditsLimit, getRemainingCredits } from '@/lib/billing/entitlements';
import { planHasFeature } from '@/lib/billing/plan-features';
import { SettingsAccountSection } from '@/components/settings/settings-account-section';
import { SettingsSubscriptionSection } from '@/components/settings/settings-subscription-section';
import { SettingsPreferencesSection } from '@/components/settings/settings-preferences-section';
import { SettingsNotificationsSection } from '@/components/settings/settings-notifications-section';
import { SettingsPrivacySection } from '@/components/settings/settings-privacy-section';
import { SettingsLegalSection } from '@/components/settings/settings-legal-section';

export default async function SettingsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  const tSettings = await getTranslations({ locale, namespace: 'settings' });
  const user = await getCurrentUser();

  if (!user) return null;

  const admin = createAdminClient();
  const periodStart = getPeriodStartForPlan(user.plan);

  const [{ data: usage }, { data: subscription }] = await Promise.all([
    admin
      .from('tool_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('period_start', periodStart)
      .maybeSingle(),
    admin
      .from('subscriptions')
      .select('current_period_end')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
  ]);

  const creditsRemaining = getRemainingCredits(user.plan, usage);
  const creditsLimit = getCreditsLimit(user.plan);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{t('settings')}</h1>
        <p className="text-sm text-text-secondary">{tSettings('pageDescription')}</p>
      </header>

      <SettingsAccountSection
        locale={locale}
        email={user.email}
        plan={user.plan}
        createdAt={user.created_at}
      />

      <SettingsSubscriptionSection
        locale={locale}
        plan={user.plan}
        creditsRemaining={creditsRemaining}
        creditsLimit={creditsLimit}
        renewalDate={subscription?.current_period_end ?? null}
        hasStripeCustomer={!!user.stripe_customer_id}
      />

      <SettingsPreferencesSection locale={locale} />

      <SettingsNotificationsSection locale={locale} />

      <SettingsPrivacySection locale={locale} />

      <SettingsLegalSection
        locale={locale}
        showCommercialLicense={planHasFeature(user.plan, 'commercialLicense')}
      />
    </div>
  );
}
