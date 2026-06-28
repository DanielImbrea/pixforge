import Link from 'next/link';
import { Scale } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsSection } from '@/components/settings/settings-section';

interface SettingsLegalSectionProps {
  locale: Locale;
}

export async function SettingsLegalSection({ locale }: SettingsLegalSectionProps) {
  const t = await getTranslations({ locale, namespace: 'settings' });
  const tLegal = await getTranslations({ locale, namespace: 'legal' });

  return (
    <SettingsSection icon={Scale} title={t('legalTitle')} description={t('legalDescription')}>
      <SettingsRow label={t('commercialTitle')} description={t('commercialDescription')}>
        <Link
          href={`/${locale}/legal/commercial-license`}
          className="text-sm text-accent transition-colors hover:text-[color:var(--accent-hover)]"
        >
          {t('commercialLink')} →
        </Link>
      </SettingsRow>

      <SettingsRow label={tLegal('termsTitle')}>
        <Link
          href={`/${locale}/legal/terms`}
          className="text-sm text-accent transition-colors hover:text-[color:var(--accent-hover)]"
        >
          {t('viewDocument')} →
        </Link>
      </SettingsRow>

      <SettingsRow label={tLegal('privacyTitle')} border={false}>
        <Link
          href={`/${locale}/legal/privacy`}
          className="text-sm text-accent transition-colors hover:text-[color:var(--accent-hover)]"
        >
          {t('viewDocument')} →
        </Link>
      </SettingsRow>
    </SettingsSection>
  );
}
