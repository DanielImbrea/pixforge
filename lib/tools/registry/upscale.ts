import { AI_CREDIT_COST } from '@/lib/billing/credits';
import type { ToolDefinition } from '@/types';

export const upscaleTool: ToolDefinition = {
  id: 'tool_upscale_ai',
  slug: {
    en: 'image-upscaler',
    ro: 'upscalare-poze',
  },
  name: {
    en: 'AI Image Upscaler',
    ro: 'Upscalare Poze cu AI',
  },
  category: 'upscale',
  type: 'ai',
  creditsCost: AI_CREDIT_COST,
  enabledOnPlans: ['free', 'basic', 'starter', 'pro'],
  processorConfig: {
    aiProvider: 'replicate',
    aiModelId: 'nightmareai/real-esrgan',
    aiWebhookPath: '/api/webhooks/ai-provider',
  },
  limits: {
    maxUploadMB: { free: 10, basic: 10, starter: 25, pro: 100 },
    acceptedFormats: ['image/png', 'image/jpeg', 'image/webp'],
  },
  seo: {
    translations: {
      en: {
        title: 'AI Image Upscaler — Increase Photo Resolution Without Losing Detail',
        metaDescription:
          'Upscale low-resolution images up to 4x using AI. Restore detail and sharpness automatically, free to try online.',
        h1: 'Upscale your images with AI',
        intro:
          'Our AI model analyzes your photo and intelligently fills in detail as it enlarges it, producing sharper results than traditional resizing.',
        benefits: [
          'Upscale up to 4x with AI-restored detail',
          'Works well on photos, art, and screenshots',
          'Removes common compression artifacts while upscaling',
          'Commercial usage license included on Pro',
          'Processed in the cloud, no software needed',
        ],
        faq: [
          {
            question: 'How is AI upscaling different from regular resizing?',
            answer:
              'Regular resizing stretches existing pixels, which can look blurry. AI upscaling generates plausible new detail, producing sharper results at larger sizes.',
          },
          {
            question: 'How long does AI upscaling take?',
            answer: 'Most images finish in under 30 seconds, though larger files or busy queues may take a little longer.',
          },
          {
            question: 'Can I use upscaled images commercially?',
            answer: 'Pro plan subscribers receive a commercial usage license for all processed images.',
          },
        ],
        keywords: ['ai image upscaler', 'increase photo resolution', 'upscale image online'],
      },
      ro: {
        title: 'Upscalare Poze cu AI — Crește Rezoluția Fără Pierdere de Detalii',
        metaDescription:
          'Crește rezoluția imaginilor de calitate scăzută de până la 4x folosind AI. Restaurează automat detaliile și claritatea, gratuit de testat online.',
        h1: 'Upscalează-ți imaginile cu AI',
        intro:
          'Modelul nostru AI analizează poza ta și completează inteligent detaliile pe măsură ce o mărește, producând rezultate mai clare decât redimensionarea clasică.',
        benefits: [
          'Upscalare de până la 4x cu detalii restaurate prin AI',
          'Funcționează bine pe poze, artă și capturi de ecran',
          'Elimină artefactele de compresie comune în timpul upscalării',
          'Licență de utilizare comercială inclusă în planul Pro',
          'Procesat în cloud, fără software necesar',
        ],
        faq: [
          {
            question: 'Cum diferă upscalarea AI de redimensionarea obișnuită?',
            answer:
              'Redimensionarea obișnuită întinde pixelii existenți, ceea ce poate apărea neclar. Upscalarea AI generează detalii noi plauzibile, producând rezultate mai clare la dimensiuni mai mari.',
          },
          {
            question: 'Cât durează upscalarea cu AI?',
            answer: 'Majoritatea imaginilor sunt finalizate în sub 30 de secunde, dar fișierele mai mari sau cozile încărcate pot dura puțin mai mult.',
          },
          {
            question: 'Pot folosi imaginile upscalate comercial?',
            answer: 'Abonații planului Pro primesc o licență de utilizare comercială pentru toate imaginile procesate.',
          },
        ],
        keywords: ['upscalare poze ai', 'creste rezolutia pozei', 'upscale imagine online'],
      },
    },
  },
  icon: 'Maximize2',
  enabled: true,
  order: 4,
  badge: 'popular',
};
