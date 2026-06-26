import { redirect } from 'next/navigation';
import type { Locale } from '@/i18n';

export default async function MyImagesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard`);
}
