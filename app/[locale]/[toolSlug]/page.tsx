import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '@/i18n';
import { locales } from '@/i18n';
import { getAllToolStaticParams, getToolBySlug } from '@/lib/tools/registry';
import { generateToolMetadata } from '@/lib/seo/generate-metadata';
import { generateToolJsonLd } from '@/lib/seo/jsonld';
import { ToolPage } from '@/components/tools/tool-page';

export function generateStaticParams() {
  return getAllToolStaticParams(locales);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; toolSlug: string }>;
}): Promise<Metadata> {
  const { locale, toolSlug } = await params;
  const tool = getToolBySlug(locale, toolSlug);
  if (!tool) return {};
  return generateToolMetadata(tool, locale);
}

export default async function DynamicToolPage({
  params,
}: {
  params: Promise<{ locale: Locale; toolSlug: string }>;
}) {
  const { locale, toolSlug } = await params;
  const tool = getToolBySlug(locale, toolSlug);

  if (!tool) {
    notFound();
  }

  const jsonLd = generateToolJsonLd(tool, locale);

  return (
    <>
      {jsonLd.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <ToolPage tool={tool} locale={locale} />
    </>
  );
}
