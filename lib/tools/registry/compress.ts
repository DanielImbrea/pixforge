import { SHARP_CREDIT_COST } from '@/lib/billing/credits';
import type { ToolDefinition } from '@/types';

export const compressTool: ToolDefinition = {
  id: 'tool_compress',
  slug: {
    en: 'image-compressor',
    ro: 'compresie-poze',
  },
  name: {
    en: 'Image Compression',
    ro: 'Compresie Poze',
  },
  category: 'compress',
  type: 'sharp',
  creditsCost: SHARP_CREDIT_COST,
  enabledOnPlans: ['free', 'basic', 'starter', 'pro'],
  processorConfig: {
    sharpOperation: 'compress',
    sharpDefaults: {
      quality: 80,
    },
  },
  limits: {
    maxUploadMB: { free: 10, basic: 10, starter: 25, pro: 50 },
    acceptedFormats: [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/avif',
      'image/gif',
      'image/svg+xml',
    ],
  },
  seo: {
    translations: {
      en: {
        title: 'Compress Images Online – Reduce File Size, Keep Original Format | PixiqueAi',
        metaDescription:
          'Compress JPG, PNG, WebP, AVIF, SVG and GIF images in seconds. Reduce file size while keeping the original format and excellent visual quality.',
        h1: 'Compress your images',
        intro:
          'Compress JPG, PNG, WebP, AVIF, SVG and GIF images with the best balance between quality and file size.',
        howItWorks:
          'Reduce the file size of your images in seconds while keeping the original format and excellent visual quality.',
        benefits: [
          'Keeps your original format — JPG stays JPG, PNG stays PNG',
          'Adaptive compression tuned for each format',
          'Before/after file size and savings shown on every result',
          'Optional compression levels from maximum savings to higher quality',
          'Free tier available — no installation required',
        ],
        faq: [
          {
            question: 'Will compression change my file format?',
            answer:
              'No. This tool only compresses your image in its original format. Use the Smart Format Optimizer if you want automatic format conversion.',
          },
          {
            question: 'Will quality be reduced?',
            answer:
              'Compression trades some data for a smaller file, but we tune quality per format so changes stay invisible at normal viewing sizes.',
          },
          {
            question: 'Does compression change image dimensions?',
            answer: 'No, only file size changes. Use the Image Resizer if you need different dimensions.',
          },
        ],
        keywords: ['image compressor online', 'reduce image size', 'compress jpg png', 'compress image'],
      },
      ro: {
        title: 'Comprimă Imagini Online — Reduce Dimensiunea, Păstrează Formatul Original',
        metaDescription:
          'Comprimă imagini JPG, PNG, WebP, AVIF, SVG și GIF în câteva secunde. Redu dimensiunea fișierului fără a schimba formatul original.',
        h1: 'Comprimă imaginile',
        intro:
          'Comprimă imagini JPG, PNG, WebP, AVIF, SVG și GIF păstrând cea mai bună calitate posibilă.',
        howItWorks:
          'Redu dimensiunea fișierelor în doar câteva secunde, fără a schimba formatul original al imaginii.',
        benefits: [
          'Păstrează formatul original — JPG rămâne JPG, PNG rămâne PNG',
          'Compresie adaptată pentru fiecare format',
          'Dimensiune înainte/după și economii afișate la fiecare rezultat',
          'Niveluri de compresie de la economie maximă la calitate mai mare',
          'Plan gratuit disponibil — fără instalare',
        ],
        faq: [
          {
            question: 'Compresia schimbă formatul fișierului?',
            answer:
              'Nu. Această unealtă comprimă imaginea în formatul original. Folosește Smart Format Optimizer dacă vrei conversie automată de format.',
          },
          {
            question: 'Calitatea va scădea?',
            answer:
              'Compresia reduce dimensiunea fișierului, dar ajustăm calitatea pe format astfel încât diferențele să fie greu de observat la dimensiuni normale.',
          },
          {
            question: 'Compresia schimbă dimensiunile imaginii?',
            answer: 'Nu, doar dimensiunea fișierului. Folosește unealta de redimensionare dacă ai nevoie de alte dimensiuni.',
          },
        ],
        keywords: ['compresie poze', 'reduce dimensiune imagine', 'compresor imagini online'],
      },
    },
  },
  icon: 'Minimize2',
  enabled: true,
  order: 2,
};
