import { BG_REPLACE_CREDIT_COST } from '@/lib/billing/credits';
import type { ToolDefinition } from '@/types';

export const backgroundReplaceTool: ToolDefinition = {
  id: 'tool_background_replace',
  slug: {
    en: 'ai-background-replace',
    ro: 'inlocuire-fundal-ai',
  },
  name: {
    en: 'AI Background Replace',
    ro: 'Înlocuire fundal AI',
  },
  category: 'background_replace',
  type: 'ai',
  creditsCost: BG_REPLACE_CREDIT_COST,
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
        title: 'AI Background Replace – Change Photo Background Online',
        metaDescription:
          'Remove the background and replace it with studio white, Amazon-ready white, or AI-generated scenes from a text prompt. Professional compositing for e-commerce and social.',
        h1: 'AI Background Replace',
        intro:
          'Upload a photo, pick a marketplace preset or describe a new scene, and get a ready-to-use JPG with your subject naturally placed on the new background.',
        howItWorks:
          'We cut out your subject with the same AI matting as our background remover, generate or apply your chosen backdrop, then composite with balanced sizing for catalog and social use.',
        useCases: [
          'Amazon & marketplace listings on pure white',
          'Shopify product photos with lifestyle scenes',
          'Social posts with custom AI backgrounds',
        ],
        aiExplanation: [
          'Subject detection — product, portrait, or object modes with studio edge quality',
          'Solid presets — pure white and studio gray with zero extra generation cost',
          'AI scenes — Tokyo night, jungle, beach sunset, or your custom prompt',
          'Smart composite — subject scaled and centered on the new plate',
        ],
        benefits: [
          'Replace backgrounds without Photoshop',
          'Amazon-ready white and studio presets in one click',
          'Custom AI scenes from a short text prompt',
          'Same edge quality as our background remover',
          'JPEG export optimized for web and marketplaces',
        ],
        faq: [
          {
            question: 'How is this different from background removal?',
            answer:
              'Background removal exports a transparent PNG. Background replace composites your subject onto a new solid or AI-generated scene and exports a finished JPG.',
          },
          {
            question: 'Which presets are included?',
            answer:
              'Pure white, Amazon white, studio gray, soft studio gradient, Tokyo night, jungle, sunset beach, plus a custom prompt field for any scene you describe.',
          },
          {
            question: 'How many credits does it cost?',
            answer:
              'Background replace costs 12 credits per image — it includes AI cutout plus background generation or preset compositing.',
          },
          {
            question: 'Can I use results on Amazon and Shopify?',
            answer:
              'Yes. Use the Amazon white or pure white preset for catalog requirements, or lifestyle presets for ads and social.',
          },
          {
            question: 'What format is the output?',
            answer: 'Finished images export as high-quality JPEG, ready to upload to stores or social platforms.',
          },
        ],
        keywords: [
          'ai background replace',
          'change background online',
          'replace photo background',
          'product photo background',
          'amazon white background',
        ],
      },
      ro: {
        title: 'Înlocuire fundal AI – Schimbă fundalul pozei online',
        metaDescription:
          'Elimină fundalul și înlocuiește-l cu alb studio, alb Amazon sau scene generate AI din prompt. Compozit profesional pentru e-commerce și social.',
        h1: 'Înlocuire fundal AI',
        intro:
          'Încarcă o poză, alege un preset marketplace sau descrie o scenă nouă și primești un JPG gata de folosit, cu subiectul plasat natural pe noul fundal.',
        howItWorks:
          'Decupăm subiectul cu același AI matting ca la eliminare fundal, generăm sau aplicăm fundalul ales, apoi compunem cu scalare echilibrată pentru catalog și social.',
        useCases: [
          'Listări Amazon și marketplace pe alb pur',
          'Poze produs Shopify cu scene lifestyle',
          'Postări social cu fundal AI personalizat',
        ],
        aiExplanation: [
          'Detectare subiect — mod produs, portret sau obiect cu calitate margini studio',
          'Preset-uri solide — alb pur și gri studio fără cost suplimentar de generare',
          'Scene AI — Tokyo noaptea, junglă, apus pe plajă sau prompt personalizat',
          'Compozit inteligent — subiect scalat și centrat pe noul fundal',
        ],
        benefits: [
          'Înlocuiește fundalul fără Photoshop',
          'Preset-uri alb Amazon și studio dintr-un click',
          'Scene AI personalizate dintr-un prompt scurt',
          'Aceeași calitate a marginilor ca la eliminare fundal',
          'Export JPEG optimizat pentru web și marketplace',
        ],
        faq: [
          {
            question: 'Cu ce diferă de eliminarea fundalului?',
            answer:
              'Eliminarea fundalului exportă PNG transparent. Înlocuirea fundalului compune subiectul pe o scenă solidă sau generată AI și exportă JPG final.',
          },
          {
            question: 'Ce preset-uri sunt incluse?',
            answer:
              'Alb pur, alb Amazon, gri studio, gradient studio moale, Tokyo noaptea, junglă, apus pe plajă, plus câmp prompt personalizat.',
          },
          {
            question: 'Câte credite costă?',
            answer:
              'Înlocuirea fundalului costă 12 credite per imagine — include decupaj AI plus generare sau compozit preset.',
          },
          {
            question: 'Pot folosi rezultatele pe Amazon și Shopify?',
            answer:
              'Da. Folosește preset-ul alb Amazon sau alb pur pentru cerințe catalog, sau preset-uri lifestyle pentru reclame și social.',
          },
          {
            question: 'În ce format e exportul?',
            answer: 'Imaginile finale se exportă ca JPEG de calitate, gata de upload în magazine sau social.',
          },
        ],
        keywords: [
          'inlocuire fundal ai',
          'schimba fundal poza',
          'fundal alb amazon',
          'fundal produs ai',
          'background replace online',
        ],
      },
    },
  },
  icon: 'Image',
  enabled: true,
  order: 7,
  badge: 'new',
};
