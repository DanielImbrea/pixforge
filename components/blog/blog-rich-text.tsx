'use client';

import Link from 'next/link';
import type { Locale } from '@/i18n';

const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

export function BlogRichText({ text, locale }: { text: string; locale: Locale }) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = LINK_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const href = match[2].startsWith('/') ? match[2] : `/${locale}${match[2]}`;
    parts.push(
      <Link key={key++} href={href} className="text-accent hover:underline">
        {match[1]}
      </Link>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
