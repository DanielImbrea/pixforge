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
    maxUploadMB: { free: 10, basic: 10, starter: 25, pro: 50 },
    acceptedFormats: ['image/png', 'image/jpeg', 'image/webp', 'image/avif'],
    maxDimensionPx: 8000,
  },
  seo: {
    translations: {
      en: {
        title: 'Image Resizer – Resize Images Without Losing Quality',
        metaDescription:
          'Resize images to exact dimensions while preserving quality. Perfect for social media, web and print.',
        h1: 'Image Resizer',
        intro:
          'Upload a photo and set exact width and height. Aspect ratio preservation and high-quality resampling keep your image sharp for web, social, and print.',
        howItWorks:
          'Upload your image, enter target dimensions or choose a preset, and download the resized file. Lanczos3 resampling preserves clarity when downscaling.',
        benefits: [
          'Aspect ratio preservation — lock proportions or set exact pixels',
          'Social media presets for common platform sizes',
          'Works with PNG, JPG, WebP, and AVIF',
          'High-quality downscaling without visible blur',
          'Free tier available — no installation required',
        ],
        faq: [
          {
            question: 'Will resizing reduce my image quality?',
            answer:
              'Downscaling keeps clarity when target dimensions are reasonable. To enlarge beyond the original, use our AI Image Upscaler.',
          },
          {
            question: 'What file formats can I resize?',
            answer: 'You can upload PNG, JPG, WebP, or AVIF files and export to any of those formats.',
          },
          {
            question: 'Is batch resizing available?',
            answer: 'Batch resizing is available on the Pro plan. Single-image resize is available on all plans today.',
          },
          {
            question: 'Do you store uploaded images?',
            answer:
              'No. All uploaded and processed files are permanently deleted within 4 hours. Download your results before they expire.',
          },
        ],
        keywords: ['resize image online', 'change image dimensions', 'image resizer', 'resize photo online', 'emag product image', 'amazon product image size', 'shopify product image size', 'etsy image size'],
      },
      ro: {
        title: 'Redimensionare Poze Online Gratuit — Schimbă Dimensiunea în Secunde',
        metaDescription:
          'Redimensionează orice imagine la dimensiuni exacte direct din browser. Rapid, gratuit, fără software. Suportă PNG, JPG, WEBP și AVIF.',
        h1: 'Redimensionează imaginile instant',
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
              'Conturile gratuite pot redimensiona fișiere de până la 10MB. Planurile Starter și Pro ridică limita la 25MB și 50MB.',
          },
          {
            question: 'Stocați imaginile încărcate?',
            answer:
              'Nu. Toate fișierele încărcate și procesate sunt șterse permanent în cel mult 4 ore. Descarcă rezultatele înainte să expire.',
          },
        ],
        keywords: ['redimensionare poze', 'schimba dimensiunea imaginii', 'resize poza online', 'dimensiune imagine emag', 'dimensiune imagine amazon', 'dimensiune produs shopify', 'dimensiune imagine etsy'],
      },
    },
  },
  icon: 'Crop',
  enabled: true,
  order: 1,
  badge: 'popular',
};
