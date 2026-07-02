'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Check, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface PremiumUpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const STARTER_FEATURES = [
  'downloadPremiumStarterFeature1',
  'downloadPremiumStarterFeature2',
  'downloadPremiumStarterFeature3',
  'downloadPremiumStarterFeature4',
] as const;

const PRO_FEATURES = [
  'downloadPremiumProFeature1',
  'downloadPremiumProFeature2',
  'downloadPremiumProFeature3',
  'downloadPremiumProFeature4',
  'downloadPremiumProFeature5',
] as const;

export function PremiumUpgradeModal({ open, onClose }: PremiumUpgradeModalProps) {
  const t = useTranslations('tool');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  if (!open) return null;

  const goToPricing = (plan?: 'starter' | 'pro') => {
    const query = plan ? `?plan=${plan}` : '';
    window.location.href = `/${locale}/pricing${query}`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-200"
        aria-label={t('downloadPremiumMaybeLater')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-upgrade-title"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border-default bg-background-primary shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-text-tertiary hover:bg-background-secondary hover:text-text-primary transition-colors"
          aria-label={t('downloadPremiumMaybeLater')}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pt-8 pb-2 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <h2 id="premium-upgrade-title" className="text-xl font-semibold text-text-primary">
            {t('downloadPremiumTitle')}
          </h2>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">
            {t('downloadPremiumSubtitle')}
          </p>
        </div>

        <div className="grid gap-3 px-6 py-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border-default bg-background-secondary/60 p-4 flex flex-col">
            <p className="text-sm font-semibold text-text-primary">Starter</p>
            <ul className="mt-3 space-y-2 flex-1">
              {STARTER_FEATURES.map((key) => (
                <li key={key} className="flex items-start gap-2 text-xs text-text-secondary">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="secondary"
              className="mt-4 w-full"
              onClick={() => goToPricing('starter')}
            >
              {t('downloadPremiumUpgradeStarter')}
            </Button>
          </div>

          <div
            className={cn(
              'rounded-xl border p-4 flex flex-col',
              'border-accent/40 bg-gradient-to-b from-accent/5 to-background-primary shadow-sm'
            )}
          >
            <p className="text-sm font-semibold text-text-primary">Pro</p>
            <ul className="mt-3 space-y-2 flex-1">
              {PRO_FEATURES.map((key) => (
                <li key={key} className="flex items-start gap-2 text-xs text-text-secondary">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
            <Button variant="primary" className="mt-4 w-full" onClick={() => goToPricing('pro')}>
              {t('downloadPremiumUpgradePro')}
            </Button>
          </div>
        </div>

        <div className="px-6 pb-6 pt-1 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            {t('downloadPremiumMaybeLater')}
          </button>
        </div>
      </div>
    </div>
  );
}
