import type { BlogTocItem } from '@/lib/content/blog-types';

interface BlogTableOfContentsProps {
  items: BlogTocItem[];
  label: string;
}

export function BlogTableOfContents({ items, label }: BlogTableOfContentsProps) {
  if (items.length === 0) return null;

  return (
    <nav className="mb-10 rounded-lg border border-border-default bg-background-secondary/40 p-5" aria-label={label}>
      <p className="mb-3 text-sm font-semibold text-text-primary">{label}</p>
      <ol className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? 'ml-4' : undefined}>
            <a href={`#${item.id}`} className="text-text-secondary hover:text-accent transition-colors">
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
