'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
}

export function ApiKeysPanel() {
  const t = useTranslations('settings');
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadKeys = async () => {
    const res = await fetch('/api/api-keys');
    if (res.ok) {
      const data = await res.json();
      setKeys(data.keys || []);
    }
  };

  useEffect(() => {
    void loadKeys();
  }, []);

  const createKey = async () => {
    setLoading(true);
    setNewKey(null);
    const res = await fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Production' }),
    });
    setLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    setNewKey(data.key);
    await loadKeys();
  };

  const revokeKey = async (id: string) => {
    await fetch(`/api/api-keys?id=${id}`, { method: 'DELETE' });
    await loadKeys();
  };

  return (
    <Card className="max-w-2xl">
      <h2 className="text-lg font-medium text-text-primary mb-1">{t('apiKeysTitle')}</h2>
      <p className="text-sm text-text-secondary mb-4">{t('apiKeysDescription')}</p>

      <pre className="text-xs bg-background-secondary rounded-md p-3 overflow-x-auto mb-4 text-text-secondary">
        {`curl -H "Authorization: Bearer pf_live_..." \\
  ${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1/jobs`}
      </pre>

      {newKey && (
        <div className="mb-4 rounded-md border border-success/30 bg-success/5 p-3">
          <p className="text-xs text-text-secondary mb-1">{t('apiKeyCreated')}</p>
          <code className="text-xs break-all text-text-primary">{newKey}</code>
        </div>
      )}

      <Button variant="primary" size="sm" disabled={loading} onClick={() => void createKey()}>
        {t('apiKeyCreate')}
      </Button>

      <ul className="mt-6 space-y-2">
        {keys.map((key) => (
          <li
            key={key.id}
            className="flex items-center justify-between rounded-md border border-border-default px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium text-text-primary">{key.name}</p>
              <p className="text-xs text-text-tertiary">{key.key_prefix}…</p>
            </div>
            <button
              type="button"
              className="text-xs text-danger hover:underline"
              onClick={() => void revokeKey(key.id)}
            >
              {t('apiKeyRevoke')}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
