import type { ContactRequestType } from '@/lib/validation/contact-schema';
import type { Locale } from '@/i18n';

const LABELS: Record<Locale, Record<ContactRequestType, string>> = {
  ro: {
    general: 'Întrebare generală',
    bug: 'Raportare problemă',
    feature: 'Cerere funcționalitate',
    collaboration: 'Colaborare',
    other: 'Altceva',
  },
  en: {
    general: 'General question',
    bug: 'Bug report',
    feature: 'Feature request',
    collaboration: 'Collaboration',
    other: 'Other',
  },
};

export function getContactRequestTypeLabel(type: ContactRequestType, locale: Locale): string {
  return LABELS[locale][type];
}
