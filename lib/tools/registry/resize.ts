import { SHARP_CREDIT_COST } from '@/lib/billing/credits';
import type { ToolDefinition } from '@/types';

export const resizeTool: ToolDefinition = {
  id: 'tool_resize',
  slug: {
    en: 'image-resizer',
    ro: 'redimensionare-poze',
  },
  name: {
    en: 'Image Resize',
    ro: 'Redimensionare Poze',
  },
  category: 'resize',
  type: 'sharp',
  creditsCost: SHARP_CREDIT_COST,
  enabledOnPlans: ['free', 'basic', 'starter', 'pro'],
  processorConfig: {
    sharpOperation: 'resize',
    sharpDefaults: {
      fit: 'inside',
      withoutEnlargement: true,
    },
  },
  limits: {
    maxUploadMB: { free: 10, basic: 10, starter: 25, pro: 100 },
    acceptedFormats: ['image/png', 'image/jpeg', 'image/webp', 'image/avif'],
    maxDimensionPx: 8000,
  },
  seo: {
    translations: {
      en: {
        title: 'Free Online Image Resizer — Resize Photos in Seconds',
        metaDescription:
          'Resize any image to exact pixel dimensions directly in your browser. Fast, free, no software needed. Supports PNG, JPG, WEBP, and AVIF.',
        h1: 'Resize your images instantly',
        intro:
          'Upload a photo and set the exact width and height you need. Our resizer preserves quality while fitting your image to any dimension, perfect for web, social media, or print.',
        benefits: [
          'Resize to exact pixel dimensions in one click',
          'Keeps your original aspect ratio if you want it',
          'Works with PNG, JPG, WEBP, and AVIF',
          'No installation, runs entirely in your browser tab',
          'Free tier available, no credit card required',
        ],
        faq: [
          {
            question: 'Will resizing reduce my image quality?',
            answer:
              'Downscaling keeps clarity when target dimensions are reasonable. We use Lanczos3 resampling and high-fidelity encoding. To enlarge beyond the original, use our AI Upscaler.',
          },
          {
            question: 'What file formats can I resize?',
            answer: 'You can upload PNG, JPG, WEBP, or AVIF files and export to any of those formats.',
          },
          {
            question: 'Is there a file size limit?',
            answer:
              'Free accounts can resize files up to 10MB. Starter and Pro plans raise that limit to 25MB and 100MB respectively.',
          },
          {
            question: 'Do you store my uploaded images?',
            answer:
              'Uploaded originals are automatically deleted within 24 hours of processing. Processed results follow your plan retention policy.',
          },
        ],
        keywords: ['image resizer', 'resize photo online', 'resize image pixels'],
      },
      ro: {
        title: 'Redimensionare Poze Online Gratuit — Schimbă Dimensiunea în Secunde',
        metaDescription:
          'Redimensionează orice imagine la dimensiuni exacte direct din browser. Rapid, gratuit, fără software. Suportă PNG, JPG, WEBP și AVIF.',
        h1: 'Redimensionează-ți imaginile instant',
        intro:
          'Încarcă o poză și alege lățimea și înălțimea exactă de care ai nevoie. Unealta noastră păstrează calitatea imaginii în timp ce o adaptează la dimensiunea cerută, ideal pentru web, social media sau print.',
        benefits: [
          'Redimensionare la pixel exact, dintr-un singur click',
          'Păstrează proporțiile originale dacă alegi asta',
          'Funcționează cu PNG, JPG, WEBP și AVIF',
          'Nu necesită instalare, rulează direct în browser',
          'Plan gratuit disponibil, fără card bancar',
        ],
        faq: [
          {
            question: 'Redimensionarea reduce calitatea imaginii?',
            answer:
              'Micșorarea unei imagini păstrează claritatea dacă alegi dimensiuni rezonabile. Folosim Lanczos3 și encodare fără pierderi vizibile. Pentru mărire peste original, folosește Upscaler AI.',
          },
          {
            question: 'Ce formate de fișiere pot redimensiona?',
            answer: 'Poți încărca fișiere PNG, JPG, WEBP sau AVIF și exporta în orice format dintre acestea.',
          },
          {
            question: 'Există o limită de mărime a fișierului?',
            answer:
              'Conturile gratuite pot redimensiona fișiere de până la 10MB. Planurile Starter și Pro ridică limita la 25MB și 100MB.',
          },
          {
            question: 'Stocați imaginile încărcate?',
            answer:
              'Fișierele originale încărcate sunt șterse automat în 24 de ore de la procesare. Rezultatele procesate urmează politica de retenție a planului tău.',
          },
        ],
        keywords: ['redimensionare poze', 'schimba dimensiunea imaginii', 'resize poza online'],
      },
    },
  },
  icon: 'Crop',
  enabled: true,
  order: 1,
  badge: 'popular',
};
