import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, Download, Layers, Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n';
import { BATCH_MAX_FILES } from '@/lib/billing/plan-features';
import { Button } from '@/components/ui/button';

const BATCH_STEPS = ['upload', 'process', 'download'] as const;

const BATCH_PRODUCTS = [
  {
    before: '/demo/batch/batch-1-before.jpg',
    after: '/demo/batch/batch-1-after.png',
  },
  {
    before: '/demo/batch/batch-2-before.jpg',
    after: '/demo/batch/batch-2-after.png',
  },
  {
    before: '/demo/batch/batch-3-before.jpg',
    after: '/demo/batch/batch-3-after.png',
  },
] as const;

const PREVIEW_TILES = BATCH_PRODUCTS.flatMap((product) => [
  { src: product.before, variant: 'before' as const },
  { src: product.after, variant: 'after' as const, className: 'bg-white' },
]);

export async function LandingBatchBg({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const bgToolSlug = locale === 'ro' ? 'eliminare-fundal' : 'background-remover';

  return (
    <section
      aria-labelledby="batch-bg-heading"
      className="relative overflow-hidden rounded-2xl border border-border-default bg-gradient-to-br from-background-secondary/80 via-background-primary to-accent/5"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative grid gap-10 p-8 md:grid-cols-2 md:items-center md:gap-12 md:p-12 lg:p-14">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {t('batchBgBadge')}
            </span>
            <span className="rounded-full border border-border-default bg-background-primary px-3 py-1 text-xs font-medium text-text-secondary">
              {t('batchBgPlanNote')}
            </span>
          </div>

          <h2
            id="batch-bg-heading"
            className="mb-4 text-2xl font-semibold tracking-tight text-text-primary md:text-3xl text-balance"
          >
            {t('batchBgTitle')}
          </h2>
          <p className="mb-6 text-text-secondary leading-relaxed">{t('batchBgSubtitle')}</p>

          <ul className="mb-8 space-y-3">
            {BATCH_STEPS.map((step) => (
              <li key={step} className="flex items-start gap-3 text-sm text-text-secondary">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <span>{t(`batchBgStep_${step}`)}</span>
              </li>
            ))}
          </ul>

          <div className="mb-8 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border-default bg-background-primary px-3 py-2 text-sm">
              <Layers className="h-4 w-4 text-accent" aria-hidden />
              <span className="text-text-primary font-medium">
                {t('batchBgStatFiles', { max: BATCH_MAX_FILES })}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border-default bg-background-primary px-3 py-2 text-sm">
              <Download className="h-4 w-4 text-accent" aria-hidden />
              <span className="text-text-primary font-medium">{t('batchBgStatZip')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href={`/${locale}/${bgToolSlug}`}>
              <Button variant="secondary">{t('batchBgCtaTry')}</Button>
            </Link>
            <Link href={`/${locale}/pricing`}>
              <Button>{t('batchBgCtaPro')}</Button>
            </Link>
          </div>
        </div>

        <div className="relative md:pt-4">
          <div className="rounded-xl border border-border-default bg-background-primary/90 p-4 shadow-sm backdrop-blur-sm md:p-5">
            <div className="mb-4 flex items-center justify-between gap-2 border-b border-border-default pb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                {t('batchBgPreviewLabel')}
              </p>
              <span className="rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                {t('batchBgPreviewStatus')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {PREVIEW_TILES.map((tile, index) => (
                <div
                  key={`${tile.src}-${tile.variant}`}
                  className={`relative aspect-square overflow-hidden rounded-lg border border-border-default ${tile.className ?? 'bg-background-secondary'}`}
                >
                  <Image
                    src={tile.src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                  <span
                    className={`absolute bottom-1 left-1 z-10 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide shadow-sm ${
                      tile.variant === 'before'
                        ? 'bg-black/70 text-white'
                        : 'bg-emerald-700 text-white ring-1 ring-black/15'
                    }`}
                  >
                    {tile.variant === 'before' ? t('demoBefore') : t('demoAfter')}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-center text-xs text-text-tertiary">{t('batchBgPreviewCaption')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
