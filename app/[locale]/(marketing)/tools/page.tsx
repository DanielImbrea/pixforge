import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { getEnabledTools } from '@/lib/tools/registry';
import { ToolCard } from '@/components/marketplace/tool-card';
import { generateToolsIndexMetadata } from '@/lib/seo/generate-metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateToolsIndexMetadata(locale);
}

export default async function ToolsOverviewPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const tools = getEnabledTools();

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold text-text-primary mb-8">{t('toolsHeading')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} locale={locale} />
        ))}
      </div>
    </div>
  );
}
