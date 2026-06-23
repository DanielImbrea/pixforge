import { SHARP_CREDIT_COST } from '@/lib/billing/credits';
import type { ToolDefinition } from '@/types';

export const convertTool: ToolDefinition = {
  id: 'tool_convert',
  slug: {
    en: 'png-to-jpg',
    ro: 'png-in-jpg',
  },
  name: {
    en: 'Format Conversion',
    ro: 'Conversie Format',
  },
  category: 'convert',
  type: 'sharp',
  creditsCost: SHARP_CREDIT_COST,
  enabledOnPlans: ['free', 'basic', 'starter', 'pro'],
  processorConfig: {
    sharpOperation: 'convert',
    sharpDefaults: {
      targetFormat: 'webp',
    },
  },
  limits: {
    maxUploadMB: { free: 10, basic: 10, starter: 25, pro: 100 },
    acceptedFormats: ['image/png', 'image/jpeg', 'image/webp', 'image/avif'],
  },
  seo: {
    translations: {
      en: {
        title: 'Convert PNG to JPG Online — Free Image Format Converter',
        metaDescription:
          'Convert images between PNG, JPG, WEBP, and AVIF instantly in your browser. Free, fast, and no software to install.',
        h1: 'Convert image formats instantly',
        intro:
          'Upload your image and choose a target format. We handle transparency, color profiles, and quality automatically so the result looks right.',
        benefits: [
          'Convert between PNG, JPG, WEBP, and AVIF',
          'Transparent PNGs get a clean white background when converting to JPG',
          'Batch-friendly workflow on paid plans',
          'No watermarks on paid plans',
          'Fast server-side conversion',
        ],
        faq: [
          {
            question: 'What happens to transparent areas when converting PNG to JPG?',
            answer: 'JPG does not support transparency, so transparent pixels are filled with white by default.',
          },
          {
            question: 'Can I convert to WEBP or AVIF?',
            answer: 'Yes, both modern formats are supported as conversion targets for smaller file sizes.',
          },
          {
            question: 'Is image quality preserved during conversion?',
            answer: 'Yes, we use high-quality encoding settings by default to avoid visible artifacts.',
          },
        ],
        keywords: ['png to jpg', 'image format converter', 'convert webp to png'],
      },
      ro: {
        title: 'Conversie PNG în JPG Online — Convertor Gratuit de Format Imagine',
        metaDescription:
          'Convertește imagini între PNG, JPG, WEBP și AVIF instant, direct din browser. Gratuit, rapid, fără software de instalat.',
        h1: 'Convertește formatul imaginii instant',
        intro:
          'Încarcă imaginea și alege formatul țintă. Gestionăm automat transparența, profilurile de culoare și calitatea pentru un rezultat corect.',
        benefits: [
          'Convertește între PNG, JPG, WEBP și AVIF',
          'PNG-urile transparente primesc fundal alb curat la conversia în JPG',
          'Flux de lucru pentru procesare în lot pe planurile plătite',
          'Fără watermark pe planurile plătite',
          'Conversie rapidă, procesată pe server',
        ],
        faq: [
          {
            question: 'Ce se întâmplă cu zonele transparente la conversia PNG în JPG?',
            answer: 'JPG nu suportă transparență, așa că pixelii transparenți sunt umpluți cu alb implicit.',
          },
          {
            question: 'Pot converti în WEBP sau AVIF?',
            answer: 'Da, ambele formate moderne sunt suportate ca formate țintă pentru dimensiuni mai mici ale fișierului.',
          },
          {
            question: 'Calitatea imaginii este păstrată la conversie?',
            answer: 'Da, folosim setări de codare de înaltă calitate implicit pentru a evita artefactele vizibile.',
          },
        ],
        keywords: ['png in jpg', 'convertor format imagine', 'converteste webp in png'],
      },
    },
  },
  icon: 'RefreshCw',
  enabled: true,
  order: 3,
};
