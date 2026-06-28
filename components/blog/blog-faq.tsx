import type { BlogFaqItem } from '@/lib/content/blog-types';
import { BlogRichText } from './blog-rich-text';
import type { Locale } from '@/i18n';

interface BlogFaqProps {
  items: BlogFaqItem[];
  heading: string;
  locale: Locale;
}

export function BlogFaq({ items, heading, locale }: BlogFaqProps) {
  if (items.length === 0) return null;

  return (
    <section className="mb-10" aria-labelledby="blog-faq-heading">
      <h2 id="blog-faq-heading" className="text-xl font-semibold text-text-primary mb-4">
        {heading}
      </h2>
      <div className="divide-y divide-border-default rounded-lg border border-border-default">
        {items.map((item) => (
          <details key={item.question} className="group p-4">
            <summary className="cursor-pointer text-sm font-medium text-text-primary list-none flex justify-between gap-2">
              {item.question}
              <span className="text-text-tertiary group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              <BlogRichText text={item.answer} locale={locale} />
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
