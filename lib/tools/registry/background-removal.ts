import { AI_CREDIT_COST } from '@/lib/billing/credits';
import type { ToolDefinition } from '@/types';

export const backgroundRemovalTool: ToolDefinition = {
  id: 'tool_background_removal',
  slug: {
    en: 'background-remover',
    ro: 'eliminare-fundal',
  },
  name: {
    en: 'AI Subject Cutout Engine',
    ro: 'Motor AI Decupare Subiect',
  },
  category: 'background',
  type: 'ai',
  creditsCost: AI_CREDIT_COST,
  enabledOnPlans: ['free', 'basic', 'starter', 'pro'],
  processorConfig: {
    aiProvider: 'replicate',
    aiModelId: '851-labs/background-remover',
    aiWebhookPath: '/api/webhooks/ai-provider',
  },
  limits: {
    maxUploadMB: { free: 10, basic: 10, starter: 25, pro: 50 },
    acceptedFormats: ['image/png', 'image/jpeg', 'image/webp'],
  },
  seo: {
    translations: {
      en: {
        title: 'AI Background Remover – Remove Image Background Instantly & Get Transparent PNG',
        metaDescription:
          'Remove backgrounds from images instantly using AI. Get clean transparent PNGs for products, portraits and objects in seconds.',
        h1: 'AI Background Remover',
        intro:
          'Upload an image and get a clean transparent PNG in seconds. Product mode, portrait mode, and object mode optimize edges for your subject type.',
        howItWorks:
          'Our AI detects the subject, removes the background, refines hair and fine edges with adaptive matting, and exports a transparent PNG ready to download.',
        useCases: [
          'E-commerce product listings and catalogs',
          'Profile pictures and social avatars',
          'Design assets and marketing creatives',
        ],
        aiExplanation: [
          'Product mode — crisp hard edges for boxes, bottles, and merchandise',
          'Portrait mode — hair and skin edge refinement with advanced matting',
          'Transparent PNG export — alpha channel preserved for any background',
        ],
        benefits: [
          'Pixel-perfect cutouts for products, people, and objects',
          'Advanced AI matting preserves hair, fur, and fine edges',
          'Clean transparent PNG ready for e-commerce and design',
          'No manual selection or masking required',
          'Studio-grade edge refinement for professional output',
        ],
        faq: [
          {
            question: 'Does it work on hair?',
            answer:
              'Yes. Portrait mode and high edge quality settings use advanced matting to preserve hair strands and soft edges naturally.',
          },
          {
            question: 'Is it free?',
            answer:
              'Yes — start with the free plan (3 credits per day). Background removal costs 5 credits per image on all plans.',
          },
          {
            question: 'Can I use cutouts for e-commerce?',
            answer: 'Yes — product mode is optimized for catalog photography. Pro plan includes a commercial usage license.',
          },
        ],
        keywords: ['remove background', 'remove bg online free', 'png transparent background', 'background remover'],
      },
      ro: {
        title: 'Eliminare Fundal AI cu Rafinare Pixel-Perfect a Marginilor',
        metaDescription:
          'Extrage subiecte cu rafinare AI a marginilor. Optimizare separată pentru produse, portrete și obiecte — PNG transparent pentru e-commerce și design.',
        h1: 'Extrage subiecte cu rafinare AI a marginilor',
        intro:
          'Încarcă o imagine — motorul detectează subiectul (persoană, produs sau obiect), elimină fundalul și livrează PNG transparent cu margini curate, naturale și matting adaptiv.',
        benefits: [
          'Decupaje pixel-perfect pentru produse, persoane și obiecte',
          'Matting AI avansat păstrează părul, blana și marginile fine',
          'PNG transparent curat pentru e-commerce, design și marketing',
          'Fără selecție manuală sau mascare necesară',
          'Pipeline optimizat pentru rezultate de înaltă calitate',
          'Rafinare margini de nivel studio pentru output profesional',
        ],
        faq: [
          {
            question: 'Cum diferă de eliminatoarele de fundal de bază?',
            answer:
              'Clasificăm imaginea și aplicăm procesare specializată — margini dure pentru produse, matting sigur pentru păr la portrete, rafinare echilibrată pentru obiecte — plus post-procesare dehalo.',
          },
          {
            question: 'Ce sunt modurile de calitate a marginilor?',
            answer:
              'Standard e cel mai rapid. Precizie înaltă (recomandat) adaugă rafinare alpha matting și eliminare halou. Calitate studio aplică curățarea maximă a marginilor.',
          },
          {
            question: 'Pot folosi decupajele pentru e-commerce?',
            answer: 'Da — modul produs e optimizat pentru fotografie de catalog. Planul Pro include licență comercială.',
          },
        ],
        keywords: [
          'eliminare fundal pixel perfect',
          'decupare subiect ai',
          'png transparent e-commerce',
          'eliminator fundal par',
        ],
      },
    },
  },
  icon: 'Eraser',
  enabled: true,
  order: 5,
  badge: 'new',
};
