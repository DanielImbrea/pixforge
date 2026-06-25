'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface AdminDeleteImageButtonProps {
  storageFileId: string;
}

export function AdminDeleteImageButton({ storageFileId }: AdminDeleteImageButtonProps) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(t('confirmDeleteImage'))) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/images/${storageFileId}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || t('deleteFailed'));
      }
      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t('deleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="danger" size="sm" disabled={loading} onClick={() => void handleDelete()}>
      {loading ? t('deleting') : t('deleteImage')}
    </Button>
  );
}
