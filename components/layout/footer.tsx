import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { getEnabledTools } from '@/lib/tools/registry';

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const tools = getEnabledTools();

  return (
    <footer className="border-t border-border-default mt-24">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <p className="font-semibold text-text-primary mb-3">PixelForge</p>
          <p className="text-sm text-text-tertiary">{t('tagline')}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary mb-3">{t('tools')}</p>
          <ul className="space-y-2">
            {tools.map((tool) => (
              <li key={tool.id}>
                <Link
                  href={`/${locale}/${tool.slug[locale]}`}
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  {tool.name[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary mb-3">{t('company')}</p>
          <ul className="space-y-2">
            <li>
              <Link href={`/${locale}/blog`} className="text-sm text-text-secondary hover:text-text-primary">
                {t('blog')}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/pricing`} className="text-sm text-text-secondary hover:text-text-primary">
                {t('pricing')}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/about`} className="text-sm text-text-secondary hover:text-text-primary">
                {t('about')}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-6 border-t border-border-default text-xs text-text-tertiary">
        © {new Date().getFullYear()} PixelForge. {t('rights')}
      </div>
    </footer>
  );
}
