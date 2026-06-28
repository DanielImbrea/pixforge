import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Locale } from '@/i18n';
import { locales } from '@/i18n';
import { BLOG_POSTS, getAllBlogSlugs, getBlogPost } from '@/lib/content/blog-posts';
import { slugifyHeading } from '@/lib/content/blog-types';
import { generateBlogPostMetadata } from '@/lib/seo/generate-metadata';
import { generateBlogPostJsonLd } from '@/lib/seo/jsonld';
import { BlogTableOfContents } from '@/components/blog/blog-table-of-contents';
import { BlogRichText } from '@/components/blog/blog-rich-text';
import { BlogFaq } from '@/components/blog/blog-faq';
import { BlogCta } from '@/components/blog/blog-cta';

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
  return generateBlogPostMetadata(locale, slug, {
    seoTitle: copy.seoTitle,
    metaDescription: copy.metaDescription,
    ogTitle: copy.ogTitle,
    ogDescription: copy.ogDescription,
  });
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
  const isRo = locale === 'ro';
  const tocLabel = isRo ? 'Cuprins' : 'Table of contents';
  const faqHeading = isRo ? 'Întrebări frecvente' : 'Frequently asked questions';
  const relatedLabel = isRo ? 'Continuă lectura' : 'Continue reading';
  const toolHref = copy.ctaToolSlug ? `/${locale}/${copy.ctaToolSlug}` : `/${locale}/tools`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="max-w-2xl mx-auto px-6 py-16">
        <Link href={`/${locale}/blog`} className="text-sm text-accent hover:underline mb-6 inline-block">
          ← {isRo ? 'Înapoi la blog' : 'Back to blog'}
        </Link>
        <time className="text-xs text-text-tertiary block mb-2">{post.publishedAt}</time>
        <h1 className="text-3xl font-semibold text-text-primary mb-6 text-balance">{copy.title}</h1>

        {copy.intro && (
          <div className="text-text-secondary leading-relaxed mb-8 space-y-4">
            {copy.intro.split('\n\n').map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>
                <BlogRichText text={paragraph} locale={locale} />
              </p>
            ))}
          </div>
        )}

        <BlogTableOfContents items={copy.tableOfContents} label={tocLabel} />

        {copy.sections.map((section) => (
          <section key={section.id} id={section.id} className="mb-10 scroll-mt-24">
            <h2 className="text-xl font-semibold text-text-primary mb-3">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="text-text-secondary mb-3 leading-relaxed">
                <BlogRichText text={paragraph} locale={locale} />
              </p>
            ))}
            {section.subsections?.map((sub) => (
              <div key={sub.heading} id={slugifyHeading(sub.heading)} className="mt-6 scroll-mt-24">
                <h3 className="text-lg font-medium text-text-primary mb-2">{sub.heading}</h3>
                {sub.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="text-text-secondary mb-3 leading-relaxed">
                    <BlogRichText text={paragraph} locale={locale} />
                  </p>
                ))}
              </div>
            ))}
          </section>
        ))}

        {copy.relatedLinks.length > 0 && (
          <aside className="mb-10 rounded-lg border border-border-default p-5">
            <p className="text-sm font-semibold text-text-primary mb-3">{relatedLabel}</p>
            <ul className="space-y-2 text-sm">
              {copy.relatedLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href.startsWith('/') ? link.href : `/${locale}${link.href}`} className="text-accent hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {copy.ctaHeading && (
          <BlogCta
            heading={copy.ctaHeading}
            body={copy.ctaBody}
            buttonLabel={copy.ctaButton}
            toolHref={toolHref}
          />
        )}

        <BlogFaq items={copy.faq} heading={faqHeading} locale={locale} />
      </article>
    </>
  );
}
