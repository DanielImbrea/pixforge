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
    maxUploadMB: { free: 10, basic: 10, starter: 25, pro: 100 },
    acceptedFormats: ['image/png', 'image/jpeg', 'image/webp'],
  },
  seo: {
    translations: {
      en: {
        title: 'Compress Images Online — Reduce File Size Without Losing Quality',
        metaDescription:
          'Shrink JPG, PNG, and WEBP file sizes in seconds while keeping visual quality high. Free online image compressor, no signup required.',
        h1: 'Compress your images',
        intro:
          'Drop in a photo and we will shrink its file size using smart compression, ideal for faster websites, quicker uploads, and lower storage costs.',
        benefits: [
          'Cuts file size while keeping images sharp',
          'Adjustable quality level for fine control',
          'Supports JPG, PNG, and WEBP',
          'Processes entirely server-side, fast and reliable',
          'Free tier available for everyday use',
        ],
        faq: [
          {
            question: 'How much smaller will my file get?',
            answer:
              'Typical photos shrink 40 to 70 percent depending on content and starting quality, with little visible difference at normal viewing sizes.',
          },
          {
            question: 'Does compression change image dimensions?',
            answer: 'No, compression only reduces file size. Use our resize tool if you also need different dimensions.',
          },
          {
            question: 'Can I compress PNG files?',
            answer: 'Yes, PNG, JPG, and WEBP are all supported.',
          },
        ],
        keywords: ['compress image', 'reduce image file size', 'image compressor online'],
      },
      ro: {
        title: 'Compresie Poze Online — Reduce Dimensiunea Fără Pierdere de Calitate',
        metaDescription:
          'Micșorează dimensiunea fișierelor JPG, PNG și WEBP în câteva secunde, păstrând calitatea vizuală. Compresor de imagini gratuit, fără înregistrare.',
        h1: 'Comprimă-ți imaginile',
        intro:
          'Încarcă o poză și îi reducem dimensiunea fișierului folosind compresie inteligentă, ideal pentru site-uri mai rapide, încărcări mai rapide și costuri de stocare mai mici.',
        benefits: [
          'Reduce dimensiunea fișierului păstrând claritatea',
          'Nivel de calitate ajustabil pentru control fin',
          'Suportă JPG, PNG și WEBP',
          'Procesare integrală server-side, rapidă și fiabilă',
          'Plan gratuit disponibil pentru uz zilnic',
        ],
        faq: [
          {
            question: 'Cu cât se va micșora fișierul meu?',
            answer:
              'Pozele obișnuite se micșorează cu 40 până la 70 la sută, în funcție de conținut și calitatea inițială, cu diferențe vizuale minime la dimensiuni normale de vizualizare.',
          },
          {
            question: 'Compresia schimbă dimensiunile imaginii?',
            answer: 'Nu, compresia reduce doar dimensiunea fișierului. Folosește unealta de redimensionare dacă ai nevoie și de alte dimensiuni.',
          },
          {
            question: 'Pot comprima fișiere PNG?',
            answer: 'Da, PNG, JPG și WEBP sunt toate suportate.',
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
