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
        title: 'AI Portrait Enhance – Natural Face Detail & Skin Retouch Online',
        metaDescription:
          'Enhance modern portraits and selfies with subtle AI detail recovery — sharper eyes, cleaner skin texture, and natural facial clarity without changing identity. Styles: natural and glamour.',
        h1: 'AI Portrait Enhance',
        intro:
          'Upload a modern portrait or selfie and let AI subtly improve facial detail, reduce noise, and refine clarity while keeping the same identity and natural skin texture.',
        howItWorks:
          'AI detects faces in your photo, enhances only the face regions, and blends them back into the original image so the result looks like the same person photographed with a better camera.',
        useCases: [
          'Profile photos for CV, LinkedIn, and social media',
          'Selfies and creator portraits',
          'Portraits taken in low light or with phone compression',
        ],
        aiExplanation: [
          'Face-only enhancement — detects and enhances facial regions without changing the background',
          'Identity preservation — keeps eye color, facial shape, lips, brows, age cues, and hairstyle intact',
          'Two subtle styles — choose Natural or Glamour depending on how visible you want the enhancement to be',
          'No fake beauty filter — improves facial clarity while preserving pores, lighting, and realistic texture',
        ],
        benefits: [
          'Premium portrait enhancement directly in your browser',
          'Natural results without plastic skin or reshaped features',
          'Works on selfies, individual portraits, and modern group photos',
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
              'Natural is ideal for LinkedIn, CV, and everyday portraits. Glamour gives slightly smoother skin, brighter eyes, and a more polished look while staying realistic.',
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
              'No. The feature is designed to preserve identity first. Natural is almost invisible, while Glamour is a bit more polished but still avoids face reshaping or beauty-filter effects.',
          },
        ],
        keywords: [
          'ai portrait enhance',
          'portrait detail enhancer',
          'portrait retouch ai',
          'enhance selfie',
          'codeformer online',
        ],
      },
      ro: {
        title: 'Îmbunătățire portret AI – Detalii faciale naturale și retuș online',
        metaDescription:
          'Îmbunătățește portrete moderne și selfie-uri cu AI — claritate mai bună pentru ochi, piele și detalii faciale, fără să schimbe identitatea. Stiluri: Natural și Glamour.',
        h1: 'Îmbunătățire portret AI',
        intro:
          'Încarcă un portret modern sau un selfie, iar AI-ul va îmbunătăți discret detaliile feței, va reduce zgomotul și va rafina claritatea, păstrând aceeași identitate și textura naturală a pielii.',
        howItWorks:
          'AI-ul detectează fețele din imagine, îmbunătățește doar regiunile faciale și le îmbină înapoi în fotografia originală, astfel încât rezultatul să pară aceeași persoană fotografiată cu o cameră mai bună.',
        useCases: [
          'Fotografii de profil pentru CV, LinkedIn și rețele sociale',
          'Selfie-uri și portrete pentru creatori',
          'Portrete făcute în lumină slabă sau comprimate de telefon',
        ],
        aiExplanation: [
          'Îmbunătățire doar pe față — detectează și procesează regiunile faciale fără să modifice fundalul',
          'Păstrarea identității — nu schimbă culoarea ochilor, forma feței, buzele, sprâncenele, vârsta sau coafura',
          'Două stiluri subtile — alege Natural sau Glamour în funcție de cât de vizibil vrei să fie efectul',
          'Fără beauty filter fals — îmbunătățește claritatea feței, dar păstrează porii, lumina și textura realistă',
        ],
        benefits: [
          'Îmbunătățire premium pentru portrete direct din browser',
          'Rezultate naturale, fără piele de plastic sau trăsături deformate',
          'Potrivit pentru selfie-uri, portrete individuale și poze moderne de grup',
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
              'Natural este ideal pentru LinkedIn, CV și portrete de zi cu zi. Glamour oferă o piele ușor mai fină, ochi puțin mai luminoși și un look mai finisat, dar tot realist.',
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
              'Nu. Feature-ul este proiectat să păstreze identitatea pe primul loc. Natural este aproape invizibil, iar Glamour este puțin mai finisat, fără efect de beauty filter sau remodelare a feței.',
          },
        ],
        keywords: [
          'imbunatatire portret ai',
          'detalii faciale naturale',
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
