import type { Locale } from '@/i18n';
import type { ToolDefinition } from '@/types';

export function generateToolJsonLd(tool: ToolDefinition, locale: Locale) {
  const copy = tool.seo.translations[locale];

  const softwareApplication = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: copy.title,
    applicationCategory: 'PhotoEditingApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
  };

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: copy.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return [softwareApplication, faqPage];
}
