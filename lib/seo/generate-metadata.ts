import type { Metadata } from 'next';
import type { Locale } from '@/i18n';
import type { ToolDefinition } from '@/types';
import { BRAND_NAME, DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/seo/constants';

export { SITE_URL };

interface PageMetadataInput {
  locale: Locale;
  pathSuffix: string;
  title: string;
  description: string;
  keywords?: string[];
  ogTitle?: string;
}

function buildPageMetadata(input: PageMetadataInput & { pathSuffix: string }): Metadata {
  const otherLocale: Locale = input.locale === 'en' ? 'ro' : 'en';
  const ogTitle = input.ogTitle || input.title;
  const path = `/${input.locale}${input.pathSuffix}`;

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: {
        en: `${SITE_URL}/en${input.pathSuffix}`,
        ro: `${SITE_URL}/ro${input.pathSuffix}`,
        'x-default': `${SITE_URL}/en${input.pathSuffix}`,
      },
    },
    openGraph: {
      title: ogTitle,
      description: input.description,
      url: `${SITE_URL}${path}`,
      siteName: BRAND_NAME,
      locale: input.locale === 'en' ? 'en_US' : 'ro_RO',
      alternateLocale: otherLocale === 'en' ? 'en_US' : 'ro_RO',
      type: 'website',
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: input.description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

export function generateToolMetadata(tool: ToolDefinition, locale: Locale): Metadata {
  const copy = tool.seo.translations[locale];

  return buildPageMetadata({
    locale,
    pathSuffix: `/${tool.slug[locale]}`,
    title: copy.title,
    description: copy.metaDescription,
    keywords: copy.keywords,
  });
}

export function generateHomeMetadata(locale: Locale): Metadata {
  if (locale === 'ro') {
    return buildPageMetadata({
      locale,
      pathSuffix: '',
      title: 'Unelte Foto AI – Upscale, Compresie, Eliminare Fundal & Conversie | PixelForge',
      description:
        'Toolkit AI all-in-one pentru imagini. Upscale, eliminare fundal, compresie și conversie format instant. Gratuit la început, fără instalare.',
      keywords: [
        'unelte foto ai',
        'editare imagini online',
        'upscale poze ai',
        'eliminare fundal',
        'compresie imagini',
      ],
    });
  }

  return buildPageMetadata({
    locale,
    pathSuffix: '',
    title: 'AI Image Tools – Upscale, Compress, Remove Background & Convert Images | PixelForge',
    description:
      'All-in-one AI image toolkit. Upscale images, remove backgrounds, compress files and convert formats instantly. Free to start, no installation required.',
    keywords: [
      'ai image tools',
      'image editing tools online',
      'free ai image tools',
      'photo editor ai',
      'remove background online',
      'image upscaler',
    ],
  });
}

export function generatePricingMetadata(locale: Locale): Metadata {
  if (locale === 'ro') {
    return buildPageMetadata({
      locale,
      pathSuffix: '/pricing',
      title: 'Prețuri – Planuri & Credite PixelForge AI Image Tools',
      description:
        'Prețuri simple pentru uneltele PixelForge AI. Începe gratuit și fă upgrade pentru mai multe credite, procesare rapidă și funcții batch.',
      keywords: ['preturi pixelforge', 'credite unelte foto', 'planuri saas imagini'],
    });
  }

  return buildPageMetadata({
    locale,
    pathSuffix: '/pricing',
    title: 'Pricing – PixelForge AI Image Tools Plans & Credits',
    description:
      'Simple pricing for PixelForge AI tools. Start free and upgrade for more credits, faster processing and batch features.',
    keywords: ['pixelforge pricing', 'ai image tools credits', 'image saas plans'],
  });
}

export function generateAboutMetadata(locale: Locale): Metadata {
  if (locale === 'ro') {
    return buildPageMetadata({
      locale,
      pathSuffix: '/about',
      title: 'Despre PixelForge – Unelte AI de Procesare Imagini pentru Creatori',
      description:
        'PixelForge ajută creatori, magazine online și echipe de marketing să optimizeze imagini cu AI — rapid, în cloud, fără Photoshop.',
      keywords: ['despre pixelforge', 'unelte imagini ai'],
    });
  }

  return buildPageMetadata({
    locale,
    pathSuffix: '/about',
    title: 'About PixelForge – AI Image Processing Tools for Creators',
    description:
      'PixelForge helps creators, e-commerce teams, and marketers optimize images with AI — fast, cloud-based, no Photoshop required.',
    keywords: ['about pixelforge', 'ai image processing tools'],
  });
}

export function generateBlogIndexMetadata(locale: Locale): Metadata {
  if (locale === 'ro') {
    return buildPageMetadata({
      locale,
      pathSuffix: '/blog',
      title: 'Blog PixelForge – Ghiduri Upscale, Compresie & Eliminare Fundal',
      description:
        'Ghiduri practice despre upscalare AI, formate imagine pentru web și eliminare fundal pentru produse.',
      keywords: ['ghid imagini web', 'blog pixelforge'],
    });
  }

  return buildPageMetadata({
    locale,
    pathSuffix: '/blog',
    title: 'PixelForge Blog – AI Image Upscaling, Compression & Background Removal Guides',
    description:
      'Practical guides on AI upscaling, web image formats, and product photo background removal.',
    keywords: ['ai image guide', 'webp vs avif', 'remove background guide'],
  });
}

export function generateBlogPostMetadata(
  locale: Locale,
  slug: string,
  title: string,
  description: string,
  keywords?: string[]
): Metadata {
  return buildPageMetadata({
    locale,
    pathSuffix: `/blog/${slug}`,
    title: `${title} | PixelForge`,
    description,
    keywords,
  });
}

export function generateToolsIndexMetadata(locale: Locale): Metadata {
  if (locale === 'ro') {
    return buildPageMetadata({
      locale,
      pathSuffix: '/tools',
      title: 'Toate Uneltele – Upscale, Compresie, Conversie & Eliminare Fundal | PixelForge',
      description: 'Explorează toate uneltele PixelForge AI pentru optimizarea imaginilor.',
    });
  }

  return buildPageMetadata({
    locale,
    pathSuffix: '/tools',
    title: 'All Tools – Upscale, Compress, Convert & Remove Background | PixelForge',
    description: 'Browse all PixelForge AI image optimization tools in one place.',
  });
}
