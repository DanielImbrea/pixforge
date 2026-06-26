'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ShieldAlert } from 'lucide-react';
import type { Locale } from '@/i18n';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsSection } from '@/components/settings/settings-section';

interface SettingsPrivacySectionProps {
  locale: Locale;
}

export function SettingsPrivacySection({ locale }: SettingsPrivacySectionProps) {
  const t = useTranslations('settings');
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<'export' | 'delete' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const exportData = async () => {
    setLoadingAction('export');
    setMessage(null);
    const res = await fetch('/api/account/export');
    setLoadingAction(null);
    if (!res.ok) {
      setMessage({ type: 'error', text: t('actionFailed') });
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `pixiqueai-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: t('exportDataSuccess') });
  };

  const deleteAccount = async () => {
    if (!window.confirm(t('deleteAccountConfirm'))) return;
    setLoadingAction('delete');
    setMessage(null);
    const res = await fetch('/api/account', { method: 'DELETE' });
    setLoadingAction(null);
    if (!res.ok) {
      setMessage({ type: 'error', text: t('actionFailed') });
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}`);
    router.refresh();
  };

  return (
    <SettingsSection icon={ShieldAlert} title={t('privacyTitle')} description={t('privacyDescription')}>
      <SettingsRow label={t('retentionPolicyLabel')} description={t('retentionPolicyDescription')} />

      <SettingsRow label={t('exportDataLabel')} description={t('exportDataDescription')}>
        <Button
          variant="secondary"
          size="sm"
          disabled={loadingAction !== null}
          onClick={() => void exportData()}
        >
          {loadingAction === 'export' ? t('working') : t('exportDataButton')}
        </Button>
      </SettingsRow>

      <div className="mt-4 rounded-lg border border-danger/30 bg-danger/5 p-4">
        <SettingsRow label={t('deleteAccountLabel')} description={t('deleteAccountDescription')} border={false}>
          <Button
            variant="secondary"
            size="sm"
            className="border-danger/30 text-danger hover:bg-danger/10"
            disabled={loadingAction !== null}
            onClick={() => void deleteAccount()}
          >
            {loadingAction === 'delete' ? t('working') : t('deleteAccountButton')}
          </Button>
        </SettingsRow>
      </div>

      {message ? (
        <p className={`mt-4 text-sm ${message.type === 'success' ? 'text-success' : 'text-danger'}`}>
          {message.text}
        </p>
      ) : null}
    </SettingsSection>
  );
}
