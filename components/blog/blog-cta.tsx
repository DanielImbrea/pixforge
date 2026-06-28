import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface BlogCtaProps {
  heading: string;
  body: string;
  buttonLabel: string;
  toolHref: string;
}

export function BlogCta({ heading, body, buttonLabel, toolHref }: BlogCtaProps) {
  return (
    <aside className="my-10 rounded-lg border border-accent/30 bg-accent/5 p-6 text-center">
      <h2 className="text-lg font-semibold text-text-primary mb-2">{heading}</h2>
      <p className="text-sm text-text-secondary mb-4 max-w-xl mx-auto">{body}</p>
      <Link href={toolHref}>
        <Button>{buttonLabel}</Button>
      </Link>
    </aside>
  );
}
