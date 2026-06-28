import type { Locale } from '@/i18n';

export interface BlogFaqItem {
  question: string;
  answer: string;
}

export interface BlogRelatedLink {
  href: string;
  label: string;
}

export interface BlogSubsection {
  heading: string;
  paragraphs: string[];
}

export interface BlogSection {
  heading: string;
  id: string;
  paragraphs: string[];
  subsections?: BlogSubsection[];
}

export interface BlogTocItem {
  id: string;
  label: string;
  level: 2 | 3;
}

export interface BlogPostTranslation {
  seoTitle: string;
  title: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  excerpt: string;
  intro: string;
  tableOfContents: BlogTocItem[];
  sections: BlogSection[];
  faq: BlogFaqItem[];
  relatedLinks: BlogRelatedLink[];
  ctaHeading: string;
  ctaBody: string;
  ctaButton: string;
  ctaToolSlug: string;
}

export interface BlogPost {
  slug: string;
  publishedAt: string;
  translations: Record<Locale, BlogPostTranslation>;
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
