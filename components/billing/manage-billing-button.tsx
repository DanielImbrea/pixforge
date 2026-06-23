'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

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
    <Button variant="secondary" onClick={handleClick} disabled={loading}>
      Manage billing
    </Button>
  );
}
