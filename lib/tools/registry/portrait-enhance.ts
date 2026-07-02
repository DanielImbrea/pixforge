import { PORTRAIT_ENHANCE_CREDIT_COST } from '@/lib/billing/credits';
import type { ToolDefinition } from '@/types';

export const portraitEnhanceTool: ToolDefinition = {
  id: 'tool_portrait_enhance',
  slug: {
    en: 'ai-portrait-enhance',
    ro: 'imbunatatire-portret-ai',
  },
  name: {
    en: 'AI Portrait Enhance',
    ro: 'Îmbunătățire portret AI',
  },
  category: 'portrait_enhance',
  type: 'ai',
  creditsCost: PORTRAIT_ENHANCE_CREDIT_COST,
  enabledOnPlans: ['free', 'basic', 'starter', 'pro'],
  processorConfig: {
    aiProvider: 'replicate',
    aiModelId: 'sczhou/codeformer',
    aiWebhookPath: '/api/webhooks/ai-provider',
  },
  limits: {
    maxUploadMB: { free: 10, basic: 10, starter: 25, pro: 50 },
    acceptedFormats: ['image/png', 'image/jpeg', 'image/webp'],
  },
  seo: {
    translations: {
      en: {
        title: 'AI Portrait Enhance – Face Restoration & Skin Retouch Online',
        metaDescription:
          'Enhance portrait photos with AI face restoration — sharpen eyes, smooth skin naturally, and recover detail from old or soft selfies. Three styles: natural, glamour, restore.',
        h1: 'AI Portrait Enhance',
        intro:
          'Upload a portrait or selfie and let AI automatically enhance facial detail, reduce image noise, and deliver natural-looking skin — no manual editing required.',
        howItWorks:
          'AI automatically detects faces in your photo and applies your chosen enhancement style to restore detail, reduce imperfections, and keep the result as natural as possible.',
        useCases: [
          'Profile photos for CV, LinkedIn, and social media',
          'Restoring old family photographs',
          'Selfies and portraits taken in low light',
        ],
        aiExplanation: [
          'Face restoration — improves eye clarity, skin texture, and facial detail',
          'Adaptive styles — choose Natural, Glamour, or Restore based on your goal',
          'Smart optimization — keeps the background and overall photo balanced',
          'No resizing — enhances your portrait at the original resolution',
        ],
        benefits: [
          'Automatic portrait enhancement directly in your browser',
          'Natural results without manual editing',
          'Works on selfies, individual portraits, and group photos',
          'Uses 10 credits per processed image',
          'Files are processed securely and deleted automatically within hours',
        ],
        faq: [
          {
            question: 'How is this different from the AI upscaler?',
            answer:
              'The AI upscaler increases resolution and improves detail across the entire image. AI Portrait Enhance is optimized specifically for faces — improving skin texture, eyes, and facial features without changing the photo resolution.',
          },
          {
            question: 'Which style should I choose?',
            answer:
              'Natural is ideal for profile photos and everyday portraits. Glamour delivers a brighter look and finer skin while staying natural. Restore is recommended for old, scanned, or damaged photos.',
          },
          {
            question: 'Does it work on group photos?',
            answer:
              'Yes. All visible faces are enhanced, though close-up portraits deliver the best results.',
          },
          {
            question: 'How many credits does it cost?',
            answer: 'Uses 10 credits per processed image.',
          },
          {
            question: 'Will it change my face too much?',
            answer:
              'Restore stays closest to the original look. Natural offers a subtle, balanced enhancement. Glamour applies a more visible improvement — pick the style that matches your intent.',
          },
        ],
        keywords: [
          'ai portrait enhance',
          'face restoration online',
          'portrait retouch ai',
          'enhance selfie',
          'codeformer online',
        ],
      },
      ro: {
        title: 'Îmbunătățire portret AI – Restaurare față și retuș online',
        metaDescription:
          'Îmbunătățește portretele cu AI — claritate pentru ochi și piele, aspect natural și recuperare de detalii pentru selfie-uri sau fotografii vechi. Stiluri: Natural, Glamour, Restaurare.',
        h1: 'Îmbunătățire portret AI',
        intro:
          'Încarcă un portret sau un selfie, iar AI-ul va îmbunătăți automat detaliile feței, va reduce zgomotul de imagine și va reda un aspect natural al pielii — fără editare manuală.',
        howItWorks:
          'AI-ul detectează automat fețele din imagine și aplică stilul de îmbunătățire selectat pentru a reda detaliile, a reduce imperfecțiunile și a păstra un aspect cât mai natural.',
        useCases: [
          'Fotografii de profil pentru CV, LinkedIn și rețele sociale',
          'Restaurarea fotografiilor vechi de familie',
          'Selfie-uri și portrete realizate în condiții de lumină slabă',
        ],
        aiExplanation: [
          'Restaurare facială — îmbunătățește claritatea ochilor, textura pielii și detaliile feței',
          'Stiluri adaptate — alege între Natural, Glamour sau Restaurare, în funcție de rezultat',
          'Optimizare inteligentă — păstrează fundalul și aspectul general al fotografiei echilibrate',
          'Fără redimensionare — îmbunătățește portretul la rezoluția originală',
        ],
        benefits: [
          'Îmbunătățire automată a portretelor direct din browser',
          'Rezultate naturale, fără editare manuală',
          'Potrivit pentru selfie-uri, portrete individuale și fotografii de grup',
          'Consumă 10 credite pentru fiecare imagine procesată',
          'Fișierele sunt procesate securizat și șterse automat după câteva ore',
        ],
        faq: [
          {
            question: 'Cu ce diferă de Upscaler-ul AI?',
            answer:
              'Upscaler-ul AI mărește rezoluția și îmbunătățește detaliile întregii imagini. Îmbunătățirea portretului AI este optimizată special pentru fețe, îmbunătățind textura pielii, ochii și trăsăturile faciale, fără a modifica rezoluția fotografiei.',
          },
          {
            question: 'Ce stil să aleg?',
            answer:
              'Natural este ideal pentru fotografii de profil și portrete de zi cu zi. Glamour oferă un aspect mai luminos și o piele mai fină, păstrând un rezultat natural. Restaurare este recomandat pentru fotografii vechi, scanate sau imagini cu detalii deteriorate.',
          },
          {
            question: 'Funcționează pe poze de grup?',
            answer:
              'Da. Toate fețele vizibile sunt îmbunătățite, deși portretele apropiate oferă cele mai bune rezultate.',
          },
          {
            question: 'Câte credite costă?',
            answer: 'Consumă 10 credite pentru fiecare imagine procesată.',
          },
          {
            question: 'Îmi va schimba prea mult fața?',
            answer:
              'Restaurare păstrează cel mai fidel aspectul original. Natural oferă un echilibru discret. Glamour aplică o îmbunătățire mai vizibilă — alege stilul potrivit intenției tale.',
          },
        ],
        keywords: [
          'imbunatatire portret ai',
          'restaurare fata online',
          'retus portret ai',
          'enhance selfie',
          'codeformer portret',
        ],
      },
    },
  },
  icon: 'ScanFace',
  enabled: true,
  order: 9,
  badge: 'new',
};
