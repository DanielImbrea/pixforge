import { AI_CREDIT_COST } from '@/lib/billing/credits';
import type { ToolDefinition } from '@/types';

export const backgroundRemovalTool: ToolDefinition = {
  id: 'tool_background_removal',
  slug: {
    en: 'background-removal',
    ro: 'eliminare-fundal',
  },
  name: {
    en: 'Background Removal',
    ro: 'Eliminare Fundal',
  },
  category: 'background',
  type: 'ai',
  creditsCost: AI_CREDIT_COST,
  enabledOnPlans: ['free', 'basic', 'starter', 'pro'],
  processorConfig: {
    aiProvider: 'replicate',
    aiModelId: '851-labs/background-removal',
    aiWebhookPath: '/api/webhooks/ai-provider',
  },
  limits: {
    maxUploadMB: { free: 10, basic: 10, starter: 25, pro: 100 },
    acceptedFormats: ['image/png', 'image/jpeg', 'image/webp'],
  },
  seo: {
    translations: {
      en: {
        title: 'Remove Image Background Online — Free AI Background Remover',
        metaDescription:
          'Automatically remove the background from any photo in seconds using AI. Get a transparent PNG ready for product photos, portraits, or designs.',
        h1: 'Remove backgrounds automatically',
        intro:
          'Upload a photo and our AI detects the subject and cuts out the background, giving you a clean transparent PNG in seconds.',
        benefits: [
          'Removes backgrounds from people, products, and objects',
          'Outputs a transparent PNG ready to use anywhere',
          'No manual selection or masking required',
          'Great for product listings and profile photos',
          'Fast cloud processing, no app to install',
        ],
        faq: [
          {
            question: 'What kinds of images work best?',
            answer: 'Photos with a clear subject and reasonable contrast against the background give the cleanest results.',
          },
          {
            question: 'What file format do I get back?',
            answer: 'You receive a PNG with a transparent background, ready to layer onto any backdrop.',
          },
          {
            question: 'Can I use this for product photography?',
            answer: 'Yes, this is one of the most common use cases. Pro plan includes a commercial usage license.',
          },
        ],
        keywords: ['remove background image', 'transparent background ai', 'background remover online'],
      },
      ro: {
        title: 'Eliminare Fundal din Imagine Online — Eliminator Fundal AI Gratuit',
        metaDescription:
          'Elimină automat fundalul din orice poză în câteva secunde folosind AI. Obține un PNG transparent pregătit pentru poze de produs, portrete sau design.',
        h1: 'Elimină fundalul automat',
        intro:
          'Încarcă o poză și AI-ul nostru detectează subiectul și decupează fundalul, oferindu-ți un PNG transparent curat în câteva secunde.',
        benefits: [
          'Elimină fundalul din poze cu persoane, produse și obiecte',
          'Generează un PNG transparent pregătit de utilizare',
          'Fără selecție manuală sau mascare necesară',
          'Ideal pentru anunțuri de produse și poze de profil',
          'Procesare rapidă în cloud, fără aplicație de instalat',
        ],
        faq: [
          {
            question: 'Ce tip de imagini funcționează cel mai bine?',
            answer: 'Pozele cu un subiect clar și contrast bun față de fundal oferă cele mai bune rezultate.',
          },
          {
            question: 'Ce format de fișier primesc înapoi?',
            answer: 'Primești un PNG cu fundal transparent, pregătit să fie plasat pe orice fundal.',
          },
          {
            question: 'Pot folosi asta pentru fotografie de produse?',
            answer: 'Da, aceasta este una dintre cele mai comune utilizări. Planul Pro include o licență de utilizare comercială.',
          },
        ],
        keywords: ['eliminare fundal imagine', 'fundal transparent ai', 'eliminator fundal online'],
      },
    },
  },
  icon: 'Eraser',
  enabled: true,
  order: 5,
  badge: 'new',
};
