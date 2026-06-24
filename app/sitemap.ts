import type { MetadataRoute } from 'next';
import { locales } from '@/i18n';
import { TOOL_REGISTRY } from '@/lib/tools/registry';
import { SITE_URL } from '@/lib/seo/constants';
import { BLOG_POSTS } from '@/lib/content/blog-posts';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    '',
    '/pricing',
    '/tools',
    '/about',
    '/blog',
    '/contact',
    '/legal/terms',
    '/legal/privacy',
    '/legal/cookies',
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1.0 : 0.7,
    }))
  );

  const toolEntries: MetadataRoute.Sitemap = TOOL_REGISTRY.filter((tool) => tool.enabled).flatMap((tool) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/${tool.slug[locale]}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  );

  const blogEntries: MetadataRoute.Sitemap = BLOG_POSTS.flatMap((post) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  );

  return [...staticEntries, ...toolEntries, ...blogEntries];
}
