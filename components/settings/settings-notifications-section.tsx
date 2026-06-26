'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import type { Locale } from '@/i18n';
import {
  DEFAULT_USER_PREFERENCES,
  readUserPreferences,
  writeUserPreferences,
  type UserPreferences,
} from '@/lib/settings/user-preferences';
import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsSection } from '@/components/settings/settings-section';

interface SettingsNotificationsSectionProps {
  locale: Locale;
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-accent' : 'bg-background-tertiary'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <span
        className={`pointer-events-none absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${
          checked ? 'left-[1.375rem]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

export function SettingsNotificationsSection({ locale: _locale }: SettingsNotificationsSectionProps) {
  const t = useTranslations('settings');
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);

  useEffect(() => {
    setPreferences(readUserPreferences());
  }, []);

  const updateNotification = (
    key: 'productUpdates' | 'securityEmails' | 'marketingEmails',
    value: boolean
  ) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    writeUserPreferences(next);
  };

  return (
    <SettingsSection
      icon={Bell}
      title={t('notificationsTitle')}
      description={t('notificationsDescription')}
    >
      <SettingsRow label={t('productUpdatesLabel')} description={t('productUpdatesDescription')}>
        <Toggle
          checked={preferences.productUpdates}
          onChange={(value) => updateNotification('productUpdates', value)}
        />
      </SettingsRow>

      <SettingsRow label={t('securityEmailsLabel')} description={t('securityEmailsDescription')}>
        <Toggle checked={preferences.securityEmails} disabled onChange={() => undefined} />
      </SettingsRow>

      <SettingsRow label={t('marketingEmailsLabel')} description={t('marketingEmailsDescription')} border={false}>
        <Toggle
          checked={preferences.marketingEmails}
          onChange={(value) => updateNotification('marketingEmails', value)}
        />
      </SettingsRow>
    </SettingsSection>
  );
}
