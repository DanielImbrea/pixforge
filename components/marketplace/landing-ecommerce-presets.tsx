import Link from 'next/link';
import { ShoppingBag, Store, Package, Star } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { ECOMMERCE_RESIZE_PRESETS } from '@/lib/tools/resize-params';
import { Button } from '@/components/ui/button';

const PRESET_ICONS = {
  emag_product: Star,
  amazon_product: Package,
  shopify_product: Store,
  etsy_listing: ShoppingBag,
} as const;

const PRESET_COPY_KEYS = {
  emag_product: {
    title: 'ecomPresetEmagTitle',
    desc: 'ecomPresetEmagDesc',
    spec: 'ecomPresetEmagSpec',
  },
  amazon_product: {
    title: 'ecomPresetAmazonTitle',
    desc: 'ecomPresetAmazonDesc',
    spec: 'ecomPresetAmazonSpec',
  },
  shopify_product: {
    title: 'ecomPresetShopifyTitle',
    desc: 'ecomPresetShopifyDesc',
    spec: 'ecomPresetShopifySpec',
  },
  etsy_listing: {
    title: 'ecomPresetEtsyTitle',
    desc: 'ecomPresetEtsyDesc',
    spec: 'ecomPresetEtsySpec',
  },
} as const;

export async function LandingEcommercePresets({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const resizeSlug = locale === 'ro' ? 'redimensionare-poze' : 'image-resizer';
  const bgSlug = locale === 'ro' ? 'eliminare-fundal' : 'background-remover';

  return (
    <section aria-labelledby="ecom-presets-heading">
      <div className="mb-10 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">
          {t('ecomPresetsEyebrow')}
        </p>
        <h2
          id="ecom-presets-heading"
          className="mb-3 text-2xl font-semibold text-text-primary md:text-3xl text-balance"
        >
          {t('ecomPresetsTitle')}
        </h2>
        <p className="mx-auto max-w-2xl text-text-secondary">{t('ecomPresetsSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {ECOMMERCE_RESIZE_PRESETS.map((preset) => {
          const Icon = PRESET_ICONS[preset.id as keyof typeof PRESET_ICONS];
          const copy = PRESET_COPY_KEYS[preset.id as keyof typeof PRESET_COPY_KEYS];

          return (
            <article
              key={preset.id}
              className={`flex flex-col rounded-xl border bg-background-secondary/40 p-6 transition-shadow hover:shadow-sm ${
                preset.featured ? 'border-accent/40 ring-1 ring-accent/15' : 'border-border-default'
              }`}
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent/20 bg-accent/10">
                  <Icon className="h-5 w-5 text-accent" aria-hidden />
                </div>
                {preset.featured ? (
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                    {t('ecomPresetFeatured')}
                  </span>
                ) : null}
              </div>
              <h3 className="mb-2 font-semibold text-text-primary">
                {t(copy.title as 'ecomPresetAmazonTitle')}
              </h3>
              <p className="mb-3 flex-1 text-sm text-text-secondary">
                {t(copy.desc as 'ecomPresetAmazonDesc')}
              </p>
              <p className="mb-5 rounded-md border border-border-default bg-background-primary px-3 py-2 text-xs font-medium text-text-primary">
                {t(copy.spec as 'ecomPresetAmazonSpec')}
              </p>
              <Link href={`/${locale}/${resizeSlug}?preset=${preset.id}`} className="mt-auto">
                <Button variant={preset.featured ? 'primary' : 'secondary'} className="w-full">
                  {t('ecomPresetsCta')}
                </Button>
              </Link>
            </article>
          );
        })}
      </div>

      <p className="mt-8 text-center text-sm text-text-secondary">
        {t('ecomPresetsBgNote')}{' '}
        <Link href={`/${locale}/${bgSlug}`} className="font-medium text-accent hover:underline">
          {t('ecomPresetsBgLink')}
        </Link>
      </p>
    </section>
  );
}
