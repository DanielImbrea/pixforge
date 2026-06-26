'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function ManageBillingButton({ label }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('settings');
  const buttonLabel = label ?? t('manageSubscriptionButton');

  const handleClick = async () => {
    setLoading(true);
    const res = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    });
    setLoading(false);

    if (!res.ok) return;
    const { url } = await res.json();
    window.location.href = url;
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleClick} disabled={loading}>
      {buttonLabel}
    </Button>
  );
}
