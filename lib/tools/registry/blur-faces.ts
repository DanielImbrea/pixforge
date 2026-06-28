import { AI_CREDIT_COST } from '@/lib/billing/credits';
import type { ToolDefinition } from '@/types';

export const blurFacesTool: ToolDefinition = {
  id: 'tool_blur_faces',
  slug: {
    en: 'blur-faces',
    ro: 'blur-fete',
  },
  name: {
    en: 'Blur Faces',
    ro: 'Blur Fețe',
  },
  category: 'faces',
  type: 'ai',
  creditsCost: AI_CREDIT_COST,
  enabledOnPlans: ['free', 'basic', 'starter', 'pro'],
  processorConfig: {
    aiProvider: 'replicate',
    aiWebhookPath: '/api/webhooks/ai-provider',
  },
  limits: {
    maxUploadMB: { free: 10, basic: 10, starter: 25, pro: 50 },
    acceptedFormats: ['image/png', 'image/jpeg', 'image/webp'],
  },
  seo: {
    translations: {
      en: {
        title: 'Blur Faces Online – Anonymize Photos with AI | PixiqueAi',
        metaDescription:
          'Automatically detect and blur faces in photos for privacy. Automatic or custom face targeting with adjustable blur strength.',
        h1: 'Blur Faces',
        intro:
          'Protect privacy by blurring faces in photos. Automatic detection blurs every face, or use custom mode to target a specific person.',
        howItWorks:
          'Upload your photo. Our AI detects faces and applies a privacy blur while keeping the original dimensions and format.',
        benefits: [
          'Automatic face detection — blur every face in one click',
          'Custom mode — blur or exclude a specific person using a reference portrait',
          'Low, medium, or strong blur strength',
          'Original dimensions preserved',
          'Before/after preview on every result',
        ],
        faq: [
          {
            question: 'Are all faces blurred in automatic mode?',
            answer:
              'Yes. Automatic detection finds every human face in the image and applies the blur strength you choose.',
          },
          {
            question: 'How does custom detection work?',
            answer:
              'Upload a clear reference portrait of the person you want to target. Choose to blur only that face or exclude that face and blur everyone else.',
          },
          {
            question: 'Will the image size change?',
            answer: 'No. The output keeps the same pixel dimensions as your original upload.',
          },
        ],
        keywords: ['blur faces online', 'anonymize photo', 'face blur privacy', 'hide faces in photo'],
      },
      ro: {
        title: 'Blur Fețe Online — Anonimizare Poze cu AI | PixiqueAi',
        metaDescription:
          'Detectează și blur-ează automat fețele din poze pentru confidențialitate. Mod automat sau personalizat.',
        h1: 'Blur Fețe',
        intro:
          'Protejează confidențialitatea blurând fețele din poze. Detecție automată sau mod personalizat pentru o persoană anume.',
        howItWorks:
          'Încarcă poza. AI-ul detectează fețele și aplică blur de confidențialitate, păstrând dimensiunile și formatul original.',
        benefits: [
          'Detecție automată — blur pe toate fețele',
          'Mod personalizat — blur sau exclude o persoană folosind o poză de referință',
          'Intensitate blur: scăzut, mediu sau puternic',
          'Dimensiuni originale păstrate',
          'Previzualizare înainte/după',
        ],
        faq: [
          {
            question: 'Toate fețele sunt blurate în mod automat?',
            answer: 'Da. Modul automat găsește fiecare față umană și aplică blur-ul ales.',
          },
          {
            question: 'Cum funcționează detecția personalizată?',
            answer:
              'Încarcă un portret clar de referință. Alege să blur-ezi doar acea față sau să o excludi și să blur-ezi restul.',
          },
          {
            question: 'Se schimbă dimensiunea imaginii?',
            answer: 'Nu. Rezultatul păstrează aceleași dimensiuni în pixeli.',
          },
        ],
        keywords: ['blur fete online', 'anonimizare poze', 'ascunde fete poza'],
      },
    },
  },
  icon: 'ScanFace',
  enabled: true,
  order: 6,
};
