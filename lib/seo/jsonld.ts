import type { Locale } from '@/i18n';
import type { ToolDefinition } from '@/types';
import { SITE_URL } from '@/lib/seo/constants';
import type { BlogPost } from '@/lib/content/blog-posts';

export function generateHomeJsonLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'PixelForge',
    applicationCategory: 'ImageEditor',
    operatingSystem: 'Web',
    description:
      locale === 'ro'
        ? 'Unelte AI pentru upscalare, compresie, eliminare fundal și conversie format.'
        : 'AI image tools for upscaling, compression, background removal and conversion.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    url: `${SITE_URL}/${locale}`,
  };
}

export function generateToolJsonLd(tool: ToolDefinition, locale: Locale) {
  const copy = tool.seo.translations[locale];
  const url = `${SITE_URL}/${locale}/${tool.slug[locale]}`;

  const softwareApplication = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: copy.h1,
    applicationCategory: 'ImageEditor',
    operatingSystem: 'Web',
    description: copy.metaDescription,
    url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
  };

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: copy.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return [softwareApplication, faqPage];
}

export function generatePricingJsonLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: locale === 'ro' ? 'Prețuri PixelForge' : 'PixelForge Pricing',
    description:
      locale === 'ro'
        ? 'Planuri și credite pentru uneltele PixelForge AI.'
        : 'Plans and credits for PixelForge AI image tools.',
    url: `${SITE_URL}/${locale}/pricing`,
  };
}

export function generateBlogPostJsonLd(post: BlogPost, locale: Locale) {
  const copy = post.translations[locale];
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: copy.title,
    description: copy.metaDescription,
    datePublished: post.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'PixelForge',
    },
    publisher: {
      '@type': 'Organization',
      name: 'PixelForge',
    },
    url: `${SITE_URL}/${locale}/blog/${post.slug}`,
  };
}
