import { AI_CREDIT_COST } from '@/lib/billing/credits';
import type { ToolDefinition } from '@/types';

export const upscaleTool: ToolDefinition = {
  id: 'tool_upscale_ai',
  slug: {
    en: 'ai-image-upscaler',
    ro: 'upscale-ai',
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
        title: 'AI Image Upscaler – Enhance and Upscale Images with AI up to 4x | PixiqueAi',
        metaDescription:
          'Upscale images with AI and restore missing details. Improve resolution up to 4x with smart enhancement for photos, artwork and screenshots.',
        h1: 'AI Image Upscaler',
        intro:
          'Upload an image and our AI reconstructs detail, reduces noise, and sharpens edges — up to 4× resolution for photos, artwork, and screenshots.',
        howItWorks:
          'Upload your image, choose Smart (auto) or manual 2× / 4×. We classify the content, route to the right AI pipeline, then show a before/after comparison so you can see the improvement.',
        bestFor: [
          'Blurry photos that need sharper detail',
          'Old images and low-resolution scans',
          'Low-resolution screenshots with small text',
        ],
        aiExplanation: [
          'Quality — reconstructs detail instead of stretching pixels; reduces blur and artifacts',
          'Intelligence — detects photo, text, or artwork and applies a different pipeline',
          'Control — Smart auto mode or manual 2× clean / 4× detail',
          'Safety — text and face protection on sensitive content',
        ],
        benefits: [
          'Before/after slider to prove the enhancement',
          'Smart routing for photos, screenshots, and artwork',
          '2× for everyday images · 4× for very low-res sources',
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
            answer:
              'Yes. You may use processed outputs however you need — personal, commercial, client work, or e-commerce. You retain rights to your content.',
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
          'Motorul clasifică imaginea, aplică enhancement specializat, apoi îți arată comparația înainte/după — ca să vezi clar diferența față de original.',
        howItWorks:
          'Încarcă imaginea, alege Smart (automat) sau 2× / 4× manual. Clasificăm conținutul, rutăm spre pipeline-ul AI potrivit, apoi afișăm slider înainte/după.',
        bestFor: [
          'Poze neclare care au nevoie de detalii mai clare',
          'Imagini vechi sau scanări low-res',
          'Screenshot-uri cu text mic',
        ],
        aiExplanation: [
          'Calitate — reconstruiește detalii, nu doar scalează pixelii; reduce blur și artefacte',
          'Inteligență — detectează foto, text sau artă și aplică pipeline diferit',
          'Control — mod Smart automat sau manual 2× curat / 4× detalii',
          'Siguranță — protecție pentru text și fețe pe conținut sensibil',
        ],
        benefits: [
          'Slider înainte/după ca să vezi clar îmbunătățirea',
          'Rutare Smart pentru poze, screenshot-uri și artă',
          '2× pentru imagini obișnuite · 4× pentru surse foarte mici',
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
            answer:
              'Da. Poți folosi rezultatele procesate cum dorești — personal, comercial, proiecte pentru clienți sau e-commerce. Păstrezi drepturile asupra conținutului tău.',
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
