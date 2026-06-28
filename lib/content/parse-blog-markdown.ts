import fs from 'fs';
import path from 'path';
import type { Locale } from '@/i18n';
import type { BlogPost, BlogPostTranslation, BlogSection, BlogTocItem } from '@/lib/content/blog-types';
import { slugifyHeading } from '@/lib/content/blog-types';

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: raw };
  }
  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    meta[key] = value;
  }
  return { meta, body: match[2].trim() };
}

function parseJsonField<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function parseBody(body: string): {
  intro: string;
  sections: BlogSection[];
  tableOfContents: BlogTocItem[];
} {
  const lines = body.split('\n');
  const introLines: string[] = [];
  const sections: BlogSection[] = [];
  const tableOfContents: BlogTocItem[] = [];

  let i = 0;
  while (i < lines.length && !lines[i].startsWith('## ')) {
    if (lines[i].trim()) introLines.push(lines[i].trim());
    i += 1;
  }

  let currentSection: BlogSection | null = null;
  let currentSubParagraphs: string[] = [];
  let currentSubHeading: string | null = null;
  let paragraphBuffer: string[] = [];

  const flushParagraphs = (target: string[]) => {
    const text = paragraphBuffer.join(' ').trim();
    if (text) target.push(text);
    paragraphBuffer = [];
  };

  const flushSubsection = () => {
    if (currentSection && currentSubHeading) {
      flushParagraphs(currentSubParagraphs);
      currentSection.subsections = currentSection.subsections ?? [];
      currentSection.subsections.push({
        heading: currentSubHeading,
        paragraphs: currentSubParagraphs,
      });
      currentSubParagraphs = [];
      currentSubHeading = null;
    }
  };

  for (; i < lines.length; i += 1) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      flushSubsection();
      if (currentSection) {
        flushParagraphs(currentSection.paragraphs);
        sections.push(currentSection);
      }
      const heading = line.slice(3).trim();
      const id = slugifyHeading(heading);
      currentSection = { heading, id, paragraphs: [] };
      tableOfContents.push({ id, label: heading, level: 2 });
      continue;
    }

    if (line.startsWith('### ')) {
      flushSubsection();
      if (currentSection) flushParagraphs(currentSection.paragraphs);
      currentSubHeading = line.slice(4).trim();
      currentSubParagraphs = [];
      tableOfContents.push({
        id: slugifyHeading(currentSubHeading),
        label: currentSubHeading,
        level: 3,
      });
      continue;
    }

    if (!line.trim()) {
      if (currentSubHeading) flushParagraphs(currentSubParagraphs);
      else if (currentSection) flushParagraphs(currentSection.paragraphs);
      continue;
    }

    if (currentSubHeading) currentSubParagraphs.push(line.trim());
    else if (currentSection) paragraphBuffer.push(line.trim());
  }

  flushSubsection();
  if (currentSection) {
    flushParagraphs(currentSection.paragraphs);
    sections.push(currentSection);
  }

  return {
    intro: introLines.join('\n\n'),
    sections,
    tableOfContents,
  };
}

function parseMarkdownFile(filePath: string): { locale: Locale; translation: BlogPostTranslation; slug: string; publishedAt: string } | null {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { meta, body } = parseFrontmatter(raw);
  const locale = meta.locale as Locale;
  if (locale !== 'en' && locale !== 'ro') return null;

  const { intro, sections, tableOfContents } = parseBody(body);

  const translation: BlogPostTranslation = {
    seoTitle: meta.seoTitle ?? meta.title ?? '',
    title: meta.title ?? '',
    metaDescription: meta.metaDescription ?? '',
    ogTitle: meta.ogTitle ?? meta.title ?? '',
    ogDescription: meta.ogDescription ?? meta.metaDescription ?? '',
    excerpt: meta.excerpt ?? meta.metaDescription ?? '',
    intro,
    tableOfContents,
    sections,
    faq: parseJsonField(meta.faq, []),
    relatedLinks: parseJsonField(meta.relatedLinks, []),
    ctaHeading: meta.ctaHeading ?? '',
    ctaBody: meta.ctaBody ?? '',
    ctaButton: meta.ctaButton ?? '',
    ctaToolSlug: meta.ctaToolSlug ?? '',
  };

  return {
    locale,
    translation,
    slug: meta.slug ?? '',
    publishedAt: meta.publishedAt ?? new Date().toISOString().slice(0, 10),
  };
}

export function loadMarkdownBlogPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));
  const bySlug = new Map<string, BlogPost>();

  for (const file of files) {
    const parsed = parseMarkdownFile(path.join(BLOG_DIR, file));
    if (!parsed || !parsed.slug) continue;

    const existing = bySlug.get(parsed.slug) ?? {
      slug: parsed.slug,
      publishedAt: parsed.publishedAt,
      translations: {} as BlogPost['translations'],
    };

    existing.translations[parsed.locale] = parsed.translation;
    if (parsed.publishedAt) existing.publishedAt = parsed.publishedAt;
    bySlug.set(parsed.slug, existing);
  }

  return Array.from(bySlug.values()).filter(
    (post) => post.translations.en && post.translations.ro
  );
}
