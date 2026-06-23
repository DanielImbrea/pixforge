import type { Metadata } from 'next';
import type { Locale } from '@/i18n';
import { SITE_URL } from '@/lib/seo/generate-metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = locale === 'en' ? 'About PixelForge' : 'Despre PixelForge';
  return {
    title,
    alternates: { canonical: `${SITE_URL}/${locale}/about` },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const isRo = locale === 'ro';

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold text-text-primary mb-6">
        {isRo ? 'Despre PixelForge' : 'About PixelForge'}
      </h1>
      <p className="text-text-secondary mb-4">
        {isRo
          ? 'PixelForge este o platformă de unelte foto bazate pe AI, construită pentru a face editarea rapidă, accesibilă și de calitate profesională.'
          : 'PixelForge is a platform of AI-powered image tools, built to make editing fast, accessible, and professional quality.'}
      </p>
      <p className="text-text-secondary">
        {isRo
          ? 'Începem cu un set restrâns de unelte esențiale și extindem continuu marketplace-ul de unelte pe baza feedback-ului utilizatorilor.'
          : 'We start with a focused set of essential tools and continuously expand the tools marketplace based on user feedback.'}
      </p>
    </div>
  );
}
