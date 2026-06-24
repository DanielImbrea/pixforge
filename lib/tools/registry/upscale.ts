import { AI_CREDIT_COST } from '@/lib/billing/credits';
import type { ToolDefinition } from '@/types';

export const upscaleTool: ToolDefinition = {
  id: 'tool_upscale_ai',
  slug: {
    en: 'ai-image-upscaler',
    ro: 'upscalare-poze',
  },
  name: {
    en: 'AI Detail Restorer & Upscaler',
    ro: 'Restaurare Detalii & Upscalare AI',
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
    maxUploadMB: { free: 10, basic: 10, starter: 25, pro: 50 },
    acceptedFormats: ['image/png', 'image/jpeg', 'image/webp'],
  },
  seo: {
    translations: {
      en: {
        title: 'AI Image Upscaler – Enhance and Upscale Images with AI up to 4x | PixelForge',
        metaDescription:
          'Upscale images with AI and restore missing details. Improve resolution up to 4x with smart enhancement for photos, artwork and screenshots.',
        h1: 'AI Image Upscaler',
        intro:
          'Upload an image and our AI reconstructs detail, reduces noise, and sharpens edges — up to 4× resolution for photos, artwork, and screenshots.',
        howItWorks:
          'Upload your image, choose Smart mode or 2× / 4× scale, and our engine classifies the content type then routes to specialized AI models with adaptive post-processing.',
        bestFor: [
          'Blurry photos that need sharper detail',
          'Old images and low-resolution scans',
          'Low-resolution screenshots with small text',
        ],
        aiExplanation: [
          'Detail reconstruction — synthesizes plausible texture instead of stretching pixels',
          'Noise reduction — cleans compression artifacts during enhancement',
          'Edge sharpening — preserves crisp lines on UI captures and artwork',
        ],
        benefits: [
          'AI reconstructs missing details — not just resizing pixels',
          'Separate enhancement paths for photos, screenshots, and artwork',
          'Smart 2× / 4× routing based on image type',
          'Up to 4× with adaptive detail reconstruction',
          'Processed securely in the cloud — no install required',
        ],
        faq: [
          {
            question: 'Is 4× always better?',
            answer:
              'Not always. 4× works best on very small sources. For screenshots or already-decent photos, 2× often produces cleaner results with less artificial texture.',
          },
          {
            question: 'Does it work on screenshots?',
            answer:
              'Yes. Screenshot mode uses edge-safe upscaling to keep text and UI elements sharp instead of blurry.',
          },
          {
            question: 'Can I use enhanced images commercially?',
            answer: 'Pro plan subscribers receive a commercial usage license for all processed images.',
          },
        ],
        keywords: ['upscale image online', 'ai image upscaler', 'enhance image quality', 'image upscaler online'],
      },
      ro: {
        title: 'Upscalare AI & Restaurare Detalii — Poze, UI și Artă',
        metaDescription:
          'Restaurează detaliile pierdute în timpul upscalării cu AI. Rutare separată pentru fotografii, screenshot-uri și artă — până la 4× cu reconstrucție adaptivă.',
        h1: 'Restaurează detaliile pierdute cu upscalare AI',
        intro:
          'Motorul clasifică imaginea, apoi aplică enhancement specializat — recuperare detalii pentru poze, upscalare sigură pentru UI și output care păstrează liniile pentru artă.',
        benefits: [
          'AI reconstruiește detalii lipsă — nu doar redimensionează pixelii',
          'Căi separate de enhancement pentru poze, screenshot-uri și artă',
          'Moduri de protecție față/text cu rutare inteligentă 2× / 4×',
          'Reduce artefactele de compresie în timpul enhancement-ului',
          'Până la 4× cu reconstrucție adaptivă de detalii',
          'Procesat securizat în cloud',
        ],
        faq: [
          {
            question: 'Cum diferă enhancement-ul AI de redimensionarea obișnuită?',
            answer:
              'Redimensionarea clasică întinde pixelii și adaugă blur. AI-ul nostru sintetizează detalii plauzibile, reduce artefactele și aplică post-procesare adaptată conținutului.',
          },
          {
            question: 'Ce face modul Smart?',
            answer:
              'Modul Smart analizează tipul imaginii și alege scala și setările optime — de exemplu 2× pentru capturi UI (protejează textul) sau 4× pentru poze mici care necesită recuperare agresivă de detalii.',
          },
          {
            question: 'Pot folosi imaginile enhance-uite comercial?',
            answer: 'Abonații planului Pro primesc licență de utilizare comercială pentru toate imaginile procesate.',
          },
        ],
        keywords: [
          'restaurare detalii ai',
          'upscalare poze ai',
          'enhance rezolutie poza',
          'upscale screenshot text',
        ],
      },
    },
  },
  icon: 'Maximize2',
  enabled: true,
  order: 4,
  badge: 'popular',
};
