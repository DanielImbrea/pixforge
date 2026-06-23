import type { Metadata } from 'next';
import type { Locale } from '@/i18n';
import type { ToolDefinition } from '@/types';

export const SITE_URL = process.env.APP_URL || 'http://localhost:3000';

export function generateToolMetadata(tool: ToolDefinition, locale: Locale): Metadata {
  const copy = tool.seo.translations[locale];
  const otherLocale: Locale = locale === 'en' ? 'ro' : 'en';
  const path = `/${locale}/${tool.slug[locale]}`;

  return {
    title: copy.title,
    description: copy.metaDescription,
    keywords: copy.keywords,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: {
        en: `${SITE_URL}/en/${tool.slug.en}`,
        ro: `${SITE_URL}/ro/${tool.slug.ro}`,
        'x-default': `${SITE_URL}/en/${tool.slug.en}`,
      },
    },
    openGraph: {
      title: copy.title,
      description: copy.metaDescription,
      url: `${SITE_URL}${path}`,
      locale: locale === 'en' ? 'en_US' : 'ro_RO',
      alternateLocale: otherLocale === 'en' ? 'en_US' : 'ro_RO',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.metaDescription,
    },
  };
}

export function generateHomeMetadata(locale: Locale): Metadata {
  const title =
    locale === 'en'
      ? 'PixelForge — AI Image Tools for Upscaling, Background Removal, and More'
      : 'PixelForge — Unelte Foto cu AI pentru Upscalare, Eliminare Fundal și Multe Altele';
  const description =
    locale === 'en'
      ? 'Upscale, remove backgrounds, resize, compress, and convert images with AI-powered tools. Free to start.'
      : 'Upscalare, eliminare fundal, redimensionare, compresie și conversie de imagini cu unelte bazate pe AI. Gratuit la început.';

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        en: `${SITE_URL}/en`,
        ro: `${SITE_URL}/ro`,
        'x-default': `${SITE_URL}/en`,
      },
    },
  };
}
