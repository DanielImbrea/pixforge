import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPeriodStartForPlan } from '@/lib/billing/plans';
import { UsageMeter } from '@/components/dashboard/usage-meter';
import { UpgradePrompt } from '@/components/dashboard/upgrade-prompt';

export default async function DashboardOverviewPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const admin = createAdminClient();
  const periodStart = getPeriodStartForPlan(user.plan);

  const { data: usage } = await admin
    .from('tool_usage')
    .select('*')
    .eq('user_id', user.id)
    .eq('period_start', periodStart)
    .maybeSingle();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-text-primary mb-6">{t('overview')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UsageMeter plan={user.plan} creditsUsed={usage?.unit_count || 0} />
        <UpgradePrompt plan={user.plan} locale={locale} />
      </div>
    </div>
  );
}
