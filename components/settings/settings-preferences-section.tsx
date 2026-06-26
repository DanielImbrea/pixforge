'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal } from 'lucide-react';
import type { Locale } from '@/i18n';
import {
  DEFAULT_USER_PREFERENCES,
  readUserPreferences,
  writeUserPreferences,
  type DownloadFormatPreference,
  type ImageQualityPreference,
  type UserPreferences,
} from '@/lib/settings/user-preferences';
import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsSection } from '@/components/settings/settings-section';

const selectClassName =
  'h-9 min-w-[10rem] rounded-md border border-border-default bg-background-primary px-3 text-sm text-text-primary transition-colors hover:border-[color:var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-accent';

interface SettingsPreferencesSectionProps {
  locale: Locale;
}

export function SettingsPreferencesSection({ locale }: SettingsPreferencesSectionProps) {
  const t = useTranslations('settings');
  const pathname = usePathname();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);

  useEffect(() => {
    const stored = readUserPreferences();
    setPreferences({ ...stored, language: locale });
  }, [locale]);

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    writeUserPreferences(next);
  };

  const otherLocale: Locale = locale === 'en' ? 'ro' : 'en';
  const languageHref = pathname.replace(`/${locale}`, `/${otherLocale}`) || `/${otherLocale}/settings`;

  return (
    <SettingsSection icon={SlidersHorizontal} title={t('preferencesTitle')} description={t('preferencesDescription')}>
      <SettingsRow label={t('downloadFormatLabel')} description={t('downloadFormatDescription')}>
        <select
          className={selectClassName}
          value={preferences.downloadFormat}
          onChange={(e) => updatePreference('downloadFormat', e.target.value as DownloadFormatPreference)}
        >
          <option value="auto">{t('downloadFormatAuto')}</option>
          <option value="webp">WebP</option>
          <option value="jpeg">JPEG</option>
          <option value="png">PNG</option>
        </select>
      </SettingsRow>

      <SettingsRow label={t('languageLabel')} description={t('languageDescription')}>
        <Link
          href={languageHref}
          className={`${selectClassName} inline-flex items-center justify-center no-underline`}
        >
          {locale === 'en' ? t('languageEnglish') : t('languageRomanian')}
        </Link>
      </SettingsRow>

      <SettingsRow label={t('imageQualityLabel')} description={t('imageQualityDescription')} border={false}>
        <select
          className={selectClassName}
          value={preferences.imageQuality}
          onChange={(e) => updatePreference('imageQuality', e.target.value as ImageQualityPreference)}
        >
          <option value="balanced">{t('imageQualityBalanced')}</option>
          <option value="max">{t('imageQualityMax')}</option>
          <option value="fast">{t('imageQualityFast')}</option>
        </select>
      </SettingsRow>
    </SettingsSection>
  );
}
