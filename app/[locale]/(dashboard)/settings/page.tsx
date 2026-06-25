import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { LogoutButton } from '@/components/auth/logout-button';
import { ApiKeysPanel } from '@/components/settings/api-keys-panel';
import { EconomicsPanel } from '@/components/settings/economics-panel';
import { planHasFeature } from '@/lib/billing/plan-features';
import { isAdminUser } from '@/lib/admin/auth';

export default async function SettingsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  const tSettings = await getTranslations({ locale, namespace: 'settings' });
  const user = await getCurrentUser();

  if (!user) return null;

  const showApi = planHasFeature(user.plan, 'apiAccess');
  const showEconomics = isAdminUser(user);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-text-primary">{t('settings')}</h1>

      <Card className="max-w-md">
        <p className="text-sm text-text-secondary mb-1">{tSettings('email')}</p>
        <p className="text-text-primary mb-2">{user.email}</p>
        <p className="text-sm text-text-secondary mb-1">{tSettings('currentPlan')}</p>
        <p className="text-text-primary mb-6 capitalize">{user.plan}</p>
        <LogoutButton locale={locale} />
      </Card>

      {showApi && <ApiKeysPanel />}

      {showEconomics && <EconomicsPanel locale={locale} />}

      {isAdminUser(user) && (
        <Card className="max-w-md">
          <h2 className="text-lg font-medium text-text-primary mb-2">{tSettings('adminPanelTitle')}</h2>
          <p className="text-sm text-text-secondary mb-4">{tSettings('adminPanelDescription')}</p>
          <Link href={`/${locale}/admin`} className="text-sm text-accent hover:underline">
            {tSettings('adminPanelLink')} →
          </Link>
        </Card>
      )}

      {planHasFeature(user.plan, 'commercialLicense') && (
        <Card className="max-w-md">
          <h2 className="text-lg font-medium text-text-primary mb-2">{tSettings('commercialTitle')}</h2>
          <p className="text-sm text-text-secondary mb-4">{tSettings('commercialDescription')}</p>
          <Link href={`/${locale}/legal/commercial-license`} className="text-sm text-accent hover:underline">
            {tSettings('commercialLink')} →
          </Link>
        </Card>
      )}
    </div>
  );
}
