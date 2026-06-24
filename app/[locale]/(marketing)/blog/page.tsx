import Link from 'next/link';
import type { Metadata } from 'next';
import type { Locale } from '@/i18n';
import { BLOG_POSTS } from '@/lib/content/blog-posts';
import { generateBlogIndexMetadata } from '@/lib/seo/generate-metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateBlogIndexMetadata(locale);
}

export default async function BlogIndexPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const isRo = locale === 'ro';

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold text-text-primary mb-3">
        {isRo ? 'Blog PixiqueAi' : 'PixiqueAi Blog'}
      </h1>
      <p className="text-text-secondary mb-10">
        {isRo
          ? 'Ghiduri practice despre upscalare AI, formate web și eliminare fundal.'
          : 'Practical guides on AI upscaling, web image formats, and background removal.'}
      </p>
      <ul className="space-y-8">
        {BLOG_POSTS.map((post) => {
          const copy = post.translations[locale];
          return (
            <li key={post.slug} className="border-b border-border-default pb-8 last:border-0">
              <Link href={`/${locale}/blog/${post.slug}`} className="group block">
                <time className="text-xs text-text-tertiary">{post.publishedAt}</time>
                <h2 className="text-xl font-semibold text-text-primary group-hover:text-accent mt-1 mb-2">
                  {copy.title}
                </h2>
                <p className="text-sm text-text-secondary">{copy.excerpt}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
