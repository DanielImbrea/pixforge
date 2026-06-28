import type { Locale } from '@/i18n';
import type { BlogPost, BlogPostTranslation } from '@/lib/content/blog-types';
import { loadMarkdownBlogPosts } from '@/lib/content/parse-blog-markdown';

/** 301 targets for retired legacy slugs — keep in sync with next.config.js redirects. */
export const BLOG_SLUG_REDIRECTS: Record<string, string> = {
  'ai-image-upscaling-guide': 'upscale-low-resolution-images-with-ai',
  'how-to-remove-background': 'remove-background-without-photoshop',
  'image-compression-guide': 'compress-images-without-losing-quality',
};

export const BLOG_POSTS: BlogPost[] = loadMarkdownBlogPosts().sort((a, b) =>
  b.publishedAt.localeCompare(a.publishedAt)
);

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((post) => post.slug);
}

export function resolveBlogSlug(slug: string): string {
  return BLOG_SLUG_REDIRECTS[slug] ?? slug;
}

export type { BlogPost, BlogPostTranslation };
