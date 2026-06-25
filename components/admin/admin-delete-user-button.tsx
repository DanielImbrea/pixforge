'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface AdminDeleteUserButtonProps {
  userId: string;
  locale: string;
  disabled?: boolean;
}

export function AdminDeleteUserButton({ userId, locale, disabled }: AdminDeleteUserButtonProps) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!window.confirm(t('confirmDeleteUser'))) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || t('deleteFailed'));
      }
      router.push(`/${locale}/admin/users`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button variant="danger" size="sm" disabled={disabled || loading} onClick={() => void handleDelete()}>
        {loading ? t('deleting') : t('deleteUser')}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
