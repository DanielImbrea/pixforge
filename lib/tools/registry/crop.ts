import { SHARP_CREDIT_COST } from '@/lib/billing/credits';
import type { ToolDefinition } from '@/types';

export const cropTool: ToolDefinition = {
  id: 'tool_crop',
  slug: {
    en: 'image-cropper',
    ro: 'crop-imagini',
  },
  name: {
    en: 'Crop Image',
    ro: 'Crop Imagini',
  },
  category: 'crop',
  type: 'sharp',
  creditsCost: SHARP_CREDIT_COST,
  enabledOnPlans: ['free', 'basic', 'starter', 'pro'],
  processorConfig: {
    sharpOperation: 'crop',
    sharpDefaults: {},
  },
  limits: {
    maxUploadMB: { free: 10, basic: 10, starter: 25, pro: 50 },
    acceptedFormats: ['image/png', 'image/jpeg', 'image/webp', 'image/avif'],
    maxDimensionPx: 8000,
  },
  seo: {
    translations: {
      en: {
        title: 'Crop Image Online – Free Crop & Aspect Ratio Presets | PixiqueAi',
        metaDescription:
          'Crop JPG, PNG, WebP and AVIF images without losing quality. Perfect for social media, websites and print.',
        h1: 'Crop Image',
        intro:
          'Crop your images in seconds using free crop or preset aspect ratios.',
        howItWorks:
          'Crop JPG, PNG, WebP and AVIF images without losing quality. Perfect for social media, websites and print.',
        benefits: [
          'Free crop or locked aspect ratios (1:1, 16:9, 4:5, and more)',
          'Rotate and flip before export',
          'Preserves transparency on PNG, WebP and AVIF',
          'Keeps original format by default',
          'Free tier available — no installation required',
        ],
        faq: [
          {
            question: 'Will cropping change my file format?',
            answer:
              'No. By default the cropped image keeps the same format as your upload (JPG, PNG, WebP or AVIF).',
          },
          {
            question: 'Can I crop for Instagram or YouTube?',
            answer:
              'Yes. Use preset aspect ratios like 1:1, 9:16, or 16:9 to match common social and video sizes.',
          },
          {
            question: 'Does crop reduce quality?',
            answer:
              'Cropping removes pixels outside your selection but does not re-compress the remaining area beyond normal encoding.',
          },
        ],
        keywords: ['crop image online', 'image cropper', 'crop photo', 'aspect ratio crop'],
      },
      ro: {
        title: 'Crop Imagini Online — Decupare Liberă și Rapoarte Predefinite',
        metaDescription:
          'Crop JPG, PNG, WebP și AVIF fără pierdere de calitate. Perfect pentru social media, site-uri și print.',
        h1: 'Decupează imaginile',
        intro:
          'Decupează imaginile în câteva secunde, cu crop liber sau rapoarte predefinite.',
        howItWorks:
          'Crop JPG, PNG, WebP și AVIF fără pierdere de calitate. Perfect pentru social media, site-uri și print.',
        benefits: [
          'Crop liber sau raport fix (1:1, 16:9, 4:5 și altele)',
          'Rotește și oglindește înainte de export',
          'Păstrează transparența la PNG, WebP și AVIF',
          'Păstrează formatul original implicit',
          'Plan gratuit disponibil',
        ],
        faq: [
          {
            question: 'Crop-ul schimbă formatul fișierului?',
            answer:
              'Nu. Implicit, imaginea decupată păstrează același format ca fișierul încărcat.',
          },
          {
            question: 'Pot decupa pentru Instagram sau YouTube?',
            answer: 'Da. Folosește rapoarte predefinite precum 1:1, 9:16 sau 16:9.',
          },
          {
            question: 'Crop-ul reduce calitatea?',
            answer:
              'Crop-ul elimină pixelii din afara selecției, fără recompresie suplimentară a zonei păstrate.',
          },
        ],
        keywords: ['crop imagini online', 'decupare poze', 'crop poza'],
      },
    },
  },
  icon: 'Scissors',
  enabled: true,
  order: 1,
};
