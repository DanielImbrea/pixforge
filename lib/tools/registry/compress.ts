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
    acceptedFormats: ['image/png', 'image/jpeg', 'image/webp', 'image/avif'],
  },
  seo: {
    translations: {
      en: {
        title: 'Image Compressor Online – Reduce Image Size Without Losing Quality | PixiqueAi',
        metaDescription:
          'Compress images instantly with smart AI optimization. Reduce file size for JPG, PNG and WebP while preserving quality.',
        h1: 'Image Compressor Online',
        intro:
          'Drop in a photo and we shrink file size with smart compression — auto-selecting the best format and quality for photos, screenshots, and graphics.',
        howItWorks:
          'Upload your image. Our engine classifies the content, picks the optimal format (AVIF for photos, lossless WebP for UI), and applies adaptive quality settings to minimize file size.',
        benefits: [
          'Smart compression — format auto selection based on image type',
          'Photos → AVIF for maximum size savings at equal visual quality',
          'UI/screenshots → lossless WebP to preserve sharp text',
          'Before/after file size shown on every result',
          'Free tier available — no installation required',
        ],
        faq: [
          {
            question: 'Will quality be reduced?',
            answer:
              'Compression always trades some data for size, but smart routing keeps changes invisible at normal viewing sizes. Photos tolerate more compression than screenshots with small text.',
          },
          {
            question: 'Best format for web?',
            answer:
              'AVIF for photos, WebP (often lossless) for UI and graphics, PNG when you need transparency. Our tool picks automatically.',
          },
          {
            question: 'Does compression change image dimensions?',
            answer: 'No, compression only reduces file size. Use our Image Resizer if you also need different dimensions.',
          },
        ],
        keywords: ['image compressor online', 'reduce image size', 'compress jpg png', 'compress image'],
      },
      ro: {
        title: 'Compresie Poze Online — Reduce Dimensiunea Fără Pierdere de Calitate',
        metaDescription:
          'Micșorează dimensiunea fișierelor JPG, PNG și WEBP în câteva secunde, păstrând calitatea vizuală. Compresor de imagini gratuit, fără înregistrare.',
        h1: 'Comprimă-ți imaginile',
        intro:
          'Încarcă o poză și îi reducem dimensiunea fișierului cu compresie inteligentă care alege automat formatul și calitatea potrivite tipului de imagine.',
        benefits: [
          'Detectează automat fotografii vs screenshot-uri și alege formatul optim',
          'Fotografii → AVIF (fișier mai mic decât JPEG la aceeași calitate vizuală)',
          'UI/screenshot-uri → WebP lossless (fără blur pe text)',
          'Calitatea se adaptează la dimensiunea imaginii',
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
