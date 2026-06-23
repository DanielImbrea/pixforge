import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { JobHistoryTable } from '@/components/dashboard/job-history-table';
import type { ImageJobRow } from '@/types';

export default async function HistoryPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  const user = await getCurrentUser();

  if (!user) return null;

  const admin = createAdminClient();
  const { data: jobs } = await admin
    .from('image_jobs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-text-primary mb-6">{t('history')}</h1>
      <JobHistoryTable jobs={(jobs || []) as ImageJobRow[]} locale={locale} />
    </div>
  );
}
