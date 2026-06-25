import Link from 'next/link';
import { Card } from '@/components/ui/card';

interface LegalSection {
  title: string;
  body: string;
}

interface LegalDocumentProps {
  backLabel: string;
  backHref: string;
  title: string;
  intro: string;
  sections: LegalSection[];
  disclaimer?: string;
}

export function LegalDocument({
  backLabel,
  backHref,
  title,
  intro,
  sections,
  disclaimer,
}: LegalDocumentProps) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link href={backHref} className="text-sm text-accent hover:underline mb-6 inline-block">
        ← {backLabel}
      </Link>
      <h1 className="text-3xl font-semibold text-text-primary mb-4">{title}</h1>
      <Card className="prose prose-sm max-w-none text-text-secondary space-y-6">
        <p className="whitespace-pre-line">{intro}</p>
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-base font-medium text-text-primary mb-2">{section.title}</h2>
            <p className="whitespace-pre-line">{section.body}</p>
          </div>
        ))}
        {disclaimer && <p className="text-xs text-text-tertiary">{disclaimer}</p>}
      </Card>
    </div>
  );
}
