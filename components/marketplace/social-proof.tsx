interface Testimonial {
  quote: string;
  author: string;
  role: string;
  metric?: string;
}

export function SocialProof({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {testimonials.map((t) => (
        <div key={`${t.author}-${t.role}`} className="rounded-lg border border-border-default p-6">
          {t.metric && (
            <p className="text-xs font-semibold text-success mb-3">{t.metric}</p>
          )}
          <p className="text-sm text-text-secondary mb-4">&ldquo;{t.quote}&rdquo;</p>
          <p className="text-sm font-medium text-text-primary">{t.author}</p>
          <p className="text-xs text-text-tertiary">{t.role}</p>
        </div>
      ))}
    </div>
  );
}
