import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Locale } from '@/i18n';
import { locales } from '@/i18n';
import { BLOG_POSTS, getAllBlogSlugs, getBlogPost } from '@/lib/content/blog-posts';
import { generateBlogPostMetadata } from '@/lib/seo/generate-metadata';
import { generateBlogPostJsonLd } from '@/lib/seo/jsonld';

export function generateStaticParams() {
  return locales.flatMap((locale) => getAllBlogSlugs().map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  const copy = post.translations[locale];
  return generateBlogPostMetadata(locale, slug, copy.title, copy.metaDescription);
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const copy = post.translations[locale];
  const jsonLd = generateBlogPostJsonLd(post, locale);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="max-w-2xl mx-auto px-6 py-16">
        <Link href={`/${locale}/blog`} className="text-sm text-accent hover:underline mb-6 inline-block">
          ← {locale === 'ro' ? 'Înapoi la blog' : 'Back to blog'}
        </Link>
        <time className="text-xs text-text-tertiary block mb-2">{post.publishedAt}</time>
        <h1 className="text-3xl font-semibold text-text-primary mb-6">{copy.title}</h1>
        {copy.sections.map((section) => (
          <section key={section.heading} className="mb-10">
            <h2 className="text-xl font-semibold text-text-primary mb-3">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="text-text-secondary mb-3 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>
    </>
  );
}
