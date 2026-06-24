import { SHARP_CREDIT_COST } from '@/lib/billing/credits';
import type { ToolDefinition } from '@/types';

export const convertTool: ToolDefinition = {
  id: 'tool_convert',
  slug: {
    en: 'image-converter',
    ro: 'convertor-jpg-png',
  },
  name: {
    en: 'Smart Format Optimizer',
    ro: 'Optimizator Format Inteligent',
  },
  category: 'convert',
  type: 'sharp',
  creditsCost: SHARP_CREDIT_COST,
  enabledOnPlans: ['free', 'basic', 'starter', 'pro'],
  processorConfig: {
    sharpOperation: 'convert',
    sharpDefaults: {
      targetFormat: 'auto',
    },
  },
  limits: {
    maxUploadMB: { free: 10, basic: 10, starter: 25, pro: 50 },
    acceptedFormats: ['image/png', 'image/jpeg', 'image/webp', 'image/avif'],
  },
  seo: {
    translations: {
      en: {
        title: 'Image Converter – Convert PNG, JPG, WebP & AVIF Instantly Online',
        metaDescription:
          'Convert images between PNG, JPG, WebP and AVIF automatically with optimized quality settings for each format.',
        h1: 'Image Converter',
        intro:
          'Convert between PNG, JPG, WebP, and AVIF with smart format selection — optimized quality for photos, UI captures, and transparent assets.',
        howItWorks:
          'Upload any image. Our decision tree classifies content type, selects the best output format, handles transparency (PNG/WebP) or background fill (JPEG), and exports with explainable reasoning.',
        benefits: [
          'Automatic format selection with transparent reasoning',
          'AVIF-first for photos with WebP/JPEG fallback chain',
          'Lossless WebP for screenshots and UI captures',
          'Transparency handling — PNG/WebP preserve alpha; JPEG gets configurable fill',
          'Quality modes: Fast, Balanced, Max quality',
        ],
        faq: [
          {
            question: 'Which format is best?',
            answer:
              'AVIF for photos, WebP for general web use, PNG for transparency and graphics, JPEG for maximum compatibility. Our Smart mode picks automatically.',
          },
          {
            question: 'Does it keep quality?',
            answer:
              'Yes — each format uses optimized encoder settings. Choose Max quality mode for archival exports; Fast mode for smallest files.',
          },
          {
            question: 'What happens to transparent areas when converting to JPEG?',
            answer:
              'JPEG does not support transparency. Choose white, black, blurred, or auto-detected background fill before processing.',
          },
        ],
        keywords: ['convert image format', 'png to jpg', 'webp converter', 'avif converter'],
      },
      ro: {
        title: 'Optimizator Inteligent de Format — AVIF, WebP, PNG, JPEG',
        metaDescription:
          'Detectează automat tipul imaginii și exportă formatul optim cu explicații clare. AVIF pentru fotografii, WebP lossless pentru UI, moduri de calitate configurabile.',
        h1: 'Optimizator Inteligent de Format',
        intro:
          'Încarcă orice imagine — motorul detectează screenshot-uri, fotografii și grafică, apoi alege AVIF, WebP, PNG sau JPEG cu motivare transparentă și economie de dimensiune.',
        benefits: [
          'Rutare prin decision tree — nu mapping static format→tip',
          'AVIF prioritar pentru fotografii, cu fallback WebP/JPEG',
          'WebP lossless pentru screenshot-uri și capturi UI',
          'Moduri calitate: Rapid, Echilibrat, Calitate maximă',
          'Fundal personalizat la PNG→JPEG: alb, negru, blur sau auto',
        ],
        faq: [
          {
            question: 'Cum funcționează selecția automată a formatului?',
            answer:
              'Clasificăm imaginea (foto, screenshot, grafică, logo), apoi aplicăm un decision tree — ex. fotografii → AVIF, screenshot-uri cu text clar → PNG sau WebP lossless, active transparente → PNG sau WebP lossless.',
          },
          {
            question: 'Ce se întâmplă cu zonele transparente la conversia în JPEG?',
            answer:
              'JPEG nu suportă transparență. Alege fundal alb, negru, blur sau detectare automată înainte de procesare.',
          },
          {
            question: 'Pot suprascrie formatul recomandat?',
            answer:
              'Da. Folosește dropdown-ul avansat pentru AVIF, WebP, PNG sau JPEG, păstrând modul de calitate ales.',
          },
        ],
        keywords: [
          'optimizator format imagine',
          'convertor avif',
          'convertor webp png jpeg',
          'compresie automata imagini',
        ],
      },
    },
  },
  icon: 'RefreshCw',
  enabled: true,
  order: 3,
};
