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
  ogDescription?: string;
}

function buildPageMetadata(input: PageMetadataInput & { pathSuffix: string }): Metadata {
  const otherLocale: Locale = input.locale === 'en' ? 'ro' : 'en';
  const ogTitle = input.ogTitle || input.title;
  const ogDescription = input.ogDescription || input.description;
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
      description: ogDescription,
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
      description: ogDescription,
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
      title: 'Unelte Foto AI – Upscale, Compresie, Eliminare Fundal & Conversie | PixiqueAi',
      description:
        'Toolkit AI all-in-one pentru imagini. Upscale, eliminare fundal, compresie și conversie format instant. Gratuit la început, fără instalare.',
      keywords: [
        'unelte foto ai',
        'editare imagini online',
        'upscale poze ai',
        'eliminare fundal',
        'eliminare fundal in lot',
        'compresie imagini',
      ],
    });
  }

  return buildPageMetadata({
    locale,
    pathSuffix: '',
    title: 'AI Image Tools – Upscale, Compress, Remove Background & Convert Images | PixiqueAi',
    description:
      'All-in-one AI image toolkit. Upscale images, remove backgrounds, compress files and convert formats instantly. Free to start, no installation required.',
    keywords: [
      'ai image tools',
      'image editing tools online',
      'free ai image tools',
      'photo editor ai',
      'remove background online',
      'batch background removal',
      'bulk background remover',
      'image upscaler',
    ],
  });
}

export function generatePricingMetadata(locale: Locale): Metadata {
  if (locale === 'ro') {
    return buildPageMetadata({
      locale,
      pathSuffix: '/pricing',
      title: 'Prețuri – Planuri & Credite PixiqueAi Image Tools',
      description:
        'Prețuri simple pentru uneltele PixiqueAi. Începe gratuit și fă upgrade pentru mai multe credite, procesare rapidă și funcții batch.',
      keywords: ['preturi pixiqueai', 'credite unelte foto', 'planuri saas imagini'],
    });
  }

  return buildPageMetadata({
    locale,
    pathSuffix: '/pricing',
    title: 'Pricing – PixiqueAi Image Tools Plans & Credits',
    description:
      'Simple pricing for PixiqueAi tools. Start free and upgrade for more credits, faster processing and batch features.',
    keywords: ['pixiqueai pricing', 'ai image tools credits', 'image saas plans'],
  });
}

export function generateAboutMetadata(locale: Locale): Metadata {
  if (locale === 'ro') {
    return buildPageMetadata({
      locale,
      pathSuffix: '/about',
      title: 'Despre PixiqueAi – Unelte AI de Procesare Imagini pentru Creatori',
      description:
        'PixiqueAi ajută creatori, magazine online și echipe de marketing să optimizeze imagini cu AI — rapid, în cloud, fără Photoshop.',
      keywords: ['despre pixiqueai', 'unelte imagini ai'],
    });
  }

  return buildPageMetadata({
    locale,
    pathSuffix: '/about',
    title: 'About PixiqueAi – AI Image Processing Tools for Creators',
    description:
      'PixiqueAi helps creators, e-commerce teams, and marketers optimize images with AI — fast, cloud-based, no Photoshop required.',
    keywords: ['about pixiqueai', 'ai image processing tools'],
  });
}

export function generateBlogIndexMetadata(locale: Locale): Metadata {
  if (locale === 'ro') {
    return buildPageMetadata({
      locale,
      pathSuffix: '/blog',
      title: 'Blog PixiqueAi – Ghiduri Upscale, Compresie & Eliminare Fundal',
      description:
        'Ghiduri practice despre upscalare AI, formate imagine pentru web și eliminare fundal pentru produse.',
      keywords: ['ghid imagini web', 'blog pixiqueai'],
    });
  }

  return buildPageMetadata({
    locale,
    pathSuffix: '/blog',
    title: 'PixiqueAi Blog – AI Image Upscaling, Compression & Background Removal Guides',
    description:
      'Practical guides on AI upscaling, web image formats, and product photo background removal.',
    keywords: ['ai image guide', 'webp vs avif', 'remove background guide'],
  });
}

export function generateBlogPostMetadata(
  locale: Locale,
  slug: string,
  input: {
    seoTitle: string;
    metaDescription: string;
    ogTitle?: string;
    ogDescription?: string;
    keywords?: string[];
  }
): Metadata {
  return buildPageMetadata({
    locale,
    pathSuffix: `/blog/${slug}`,
    title: input.seoTitle.includes('PixiqueAi') ? input.seoTitle : `${input.seoTitle} | PixiqueAi`,
    description: input.metaDescription,
    ogTitle: input.ogTitle,
    ogDescription: input.ogDescription,
    keywords: input.keywords,
  });
}

export function generateToolsIndexMetadata(locale: Locale): Metadata {
  if (locale === 'ro') {
    return buildPageMetadata({
      locale,
      pathSuffix: '/tools',
      title: 'Toate Uneltele – Upscale, Compresie, Conversie & Eliminare Fundal | PixiqueAi',
      description: 'Explorează toate uneltele PixiqueAi pentru optimizarea imaginilor.',
    });
  }

  return buildPageMetadata({
    locale,
    pathSuffix: '/tools',
    title: 'All Tools – Upscale, Compress, Convert & Remove Background | PixiqueAi',
    description: 'Browse all PixiqueAi image optimization tools in one place.',
  });
}
