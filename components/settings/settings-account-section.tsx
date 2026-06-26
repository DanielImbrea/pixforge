import { UserRound } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import type { PlanTier } from '@/types';
import { Badge } from '@/components/ui/badge';
import { LogoutButton } from '@/components/auth/logout-button';
import { ChangePasswordButton } from '@/components/settings/change-password-button';
import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsSection } from '@/components/settings/settings-section';
import { cn } from '@/lib/utils/cn';

const planBadgeClass: Record<PlanTier, string> = {
  free: 'bg-background-tertiary text-text-secondary',
  basic: 'bg-accent/10 text-accent',
  starter: 'bg-accent/15 text-accent',
  pro: 'bg-success/10 text-success',
};

interface SettingsAccountSectionProps {
  locale: Locale;
  email: string;
  plan: PlanTier;
  createdAt: string;
}

export async function SettingsAccountSection({
  locale,
  email,
  plan,
  createdAt,
}: SettingsAccountSectionProps) {
  const t = await getTranslations({ locale, namespace: 'settings' });
  const tPricing = await getTranslations({ locale, namespace: 'pricing' });

  return (
    <SettingsSection icon={UserRound} title={t('accountTitle')} description={t('accountDescription')}>
      <SettingsRow label={t('email')}>
        <span className="text-sm text-text-secondary">{email}</span>
      </SettingsRow>

      <SettingsRow label={t('currentPlan')}>
        <Badge className={cn('capitalize', planBadgeClass[plan])}>{tPricing(plan)}</Badge>
      </SettingsRow>

      <SettingsRow label={t('memberSince')}>
        <span className="text-sm text-text-secondary">
          {new Date(createdAt).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </SettingsRow>

      <SettingsRow label={t('changePassword')} description={t('changePasswordDescription')}>
        <ChangePasswordButton email={email} locale={locale} />
      </SettingsRow>

      <SettingsRow label={t('logout')} border={false}>
        <LogoutButton locale={locale} />
      </SettingsRow>
    </SettingsSection>
  );
}
