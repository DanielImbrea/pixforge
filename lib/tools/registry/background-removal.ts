import { AI_CREDIT_COST } from '@/lib/billing/credits';
import type { ToolDefinition } from '@/types';

export const backgroundRemovalTool: ToolDefinition = {
  id: 'tool_background_removal',
  slug: {
    en: 'background-remover',
    ro: 'eliminare-fundal',
  },
  name: {
    en: 'Background Remover AI',
    ro: 'Elimină fundalul cu AI',
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
        title: 'Background Remover AI – Remove Background & Get Transparent PNG',
        metaDescription:
          'Automatically detects the subject, removes the background, and generates a transparent PNG with professionally refined edges. Optional shadow recovery for e-commerce.',
        h1: 'Background Remover AI',
        intro:
          'Automatically detects the subject, removes the background, and generates a transparent PNG with professionally refined edges.',
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
          'Shadow recovery — keeps natural drop shadows on transparent PNG (e-commerce)',
          'Transparent PNG export — alpha channel preserved for any background',
        ],
        benefits: [
          'Pixel-perfect cutouts for products, people, and objects',
          'Advanced AI matting preserves hair, fur, and fine edges',
          'Shadow recovery for catalog-style product photos',
          'Clean transparent PNG ready for e-commerce and design',
          'No manual selection or masking required',
          'Studio-grade edge refinement for professional output',
        ],
        faq: [
          {
            question: 'What file formats are supported?',
            answer:
              'You can upload JPG, JPEG, PNG, and WebP images (up to your plan size limit). The output is always a transparent PNG with alpha channel preserved.',
          },
          {
            question: 'Does the background become fully transparent?',
            answer:
              'Yes. The default output removes the background and exports a PNG with a transparent alpha channel. Enable shadow recovery if you want to keep a soft natural drop shadow under products.',
          },
          {
            question: 'What is shadow recovery?',
            answer:
              'Shadow recovery keeps the natural drop shadow from your original photo after the background is removed — ideal for product shots on white backgrounds. The shadow stays semi-transparent so you can place the cutout on any new background.',
          },
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
            answer:
              'Yes — product mode is optimized for catalog photography. Use outputs in your store, ads, or client projects on any plan.',
          },
        ],
        keywords: ['remove background', 'remove bg online free', 'png transparent background', 'background remover'],
      },
      ro: {
        title: 'Elimină fundalul cu AI – Background Remover, PNG transparent',
        metaDescription:
          'Decupaj inteligent cu rafinare profesională a marginilor. Detectează subiectul, elimină fundalul și generează PNG transparent pentru e-commerce.',
        h1: 'Elimină fundalul cu AI',
        intro:
          'Detectează automat subiectul, elimină fundalul și generează PNG transparent cu margini rafinate profesional.',
        howItWorks:
          'AI-ul detectează subiectul, elimină fundalul, rafinează părul și marginile fine cu matting adaptiv, apoi exportă PNG transparent gata de descărcat.',
        useCases: [
          'Listări produse e-commerce și cataloage',
          'Poze de profil și avatar social',
          'Asset-uri design și materiale marketing',
        ],
        aiExplanation: [
          'Mod produs — margini dure pentru cutii, sticle și merchandise',
          'Mod portret — rafinare păr și piele cu matting avansat',
          'Recuperare umbră — păstrează umbra naturală pe PNG transparent (e-commerce)',
          'Export PNG transparent — canal alpha păstrat pentru orice fundal',
        ],
        benefits: [
          'Decupaje pixel-perfect pentru produse, persoane și obiecte',
          'Matting AI avansat păstrează părul, blana și marginile fine',
          'Recuperare umbră pentru poze catalog stil profesional',
          'PNG transparent curat pentru e-commerce, design și marketing',
          'Fără selecție manuală sau mascare necesară',
          'Rafinare margini de nivel studio pentru output profesional',
        ],
        faq: [
          {
            question: 'Ce formate sunt suportate?',
            answer:
              'Poți încărca imagini JPG, JPEG, PNG și WebP (până la limita planului tău). Rezultatul este întotdeauna PNG transparent cu canal alpha păstrat.',
          },
          {
            question: 'Fundalul devine complet transparent?',
            answer:
              'Da. Implicit, fundalul este eliminat și primești PNG cu transparență completă (canal alpha). Activează recuperarea umbrei dacă vrei să păstrezi umbra moale naturală de sub produse.',
          },
          {
            question: 'Ce este recuperarea umbrei (shadow recovery)?',
            answer:
              'Păstrează umbra naturală din poza originală după eliminarea fundalului — ideal pentru produse pe fundal alb. Umbra rămâne semi-transparentă, ca să poți plasa decupajul pe orice fundal nou.',
          },
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
            answer:
              'Da — modul produs e optimizat pentru fotografie de catalog. Folosește rezultatele în magazin, reclame sau proiecte pentru clienți, pe orice plan.',
          },
        ],
        keywords: [
          'eliminare fundal pixel perfect',
          'background remover',
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
