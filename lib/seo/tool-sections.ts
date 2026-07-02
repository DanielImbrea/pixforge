import type { Locale } from '@/i18n';
import type { ToolSeoTranslation } from '@/types';

const SECTION_LABELS: Record<
  Locale,
  { howItWorks: string; bestFor: string; useCases: string; aiExplanation: string; benefits: string; faq: string }
> = {
  en: {
    howItWorks: 'How it works',
    bestFor: 'Best for',
    useCases: 'Use cases',
    aiExplanation: 'How AI enhancement works',
    benefits: 'Benefits',
    faq: 'FAQ',
  },
  ro: {
    howItWorks: 'Cum funcționează',
    bestFor: 'Ideal pentru',
    useCases: 'Cazuri de utilizare',
    aiExplanation: 'Cum funcționează editarea AI',
    benefits: 'Beneficii',
    faq: 'Întrebări frecvente',
  },
};

export function getSeoSectionLabels(locale: Locale) {
  return SECTION_LABELS[locale];
}

export function hasExtendedSeoContent(copy: ToolSeoTranslation): boolean {
  return Boolean(copy.howItWorks || copy.bestFor?.length || copy.useCases?.length || copy.aiExplanation?.length);
}
