import type { Metadata } from 'next';
import type { Locale } from '@/i18n';
import { generateAboutMetadata } from '@/lib/seo/generate-metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateAboutMetadata(locale);
}

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const isRo = locale === 'ro';

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold text-text-primary mb-6">
        {isRo ? 'Despre PixelForge' : 'About PixelForge'}
      </h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-3">{isRo ? 'Misiunea noastră' : 'Our mission'}</h2>
        <p className="text-text-secondary leading-relaxed">
          {isRo
            ? 'PixelForge face procesarea imaginilor accesibilă oricui — fără Photoshop, fără instalări, fără curbe de învățare. Uneltele AI rulează în cloud și livrează rezultate profesionale în secunde.'
            : 'PixelForge makes image processing accessible to everyone — no Photoshop, no installs, no learning curve. AI tools run in the cloud and deliver professional results in seconds.'}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-3">{isRo ? 'De ce l-am construit' : 'Why we built it'}</h2>
        <p className="text-text-secondary leading-relaxed">
          {isRo
            ? 'Creatori, magazine online și echipe de marketing pierd ore în workflow-uri fragmentate — upscale într-o aplicație, eliminare fundal în alta, compresie manuală. PixelForge le aduce pe toate într-un singur loc, cu credite transparente și prețuri clare.'
            : 'Creators, e-commerce teams, and marketers lose hours to fragmented workflows — upscale in one app, background removal in another, manual compression. PixelForge brings everything together with transparent credits and clear pricing.'}
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-3">{isRo ? 'Pentru cine e' : 'Who it is for'}</h2>
        <ul className="space-y-2 text-text-secondary">
          {(isRo
            ? [
                'Proprietari de magazine online care pregătesc poze de produs zilnic',
                'Designeri freelanceri care au nevoie de upscale și decupaje rapide',
                'Creatori de conținut care optimizează imagini pentru web și social',
                'Echipe de marketing care scalează asset-uri vizuale fără software desktop',
              ]
            : [
                'E-commerce store owners preparing product photos daily',
                'Freelance designers needing fast upscaling and cutouts',
                'Content creators optimizing images for web and social',
                'Marketing teams scaling visual assets without desktop software',
              ]
          ).map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <span className="text-success mt-0.5">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
