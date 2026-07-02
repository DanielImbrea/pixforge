import { OBJECT_REMOVE_CREDIT_COST } from '@/lib/billing/credits';
import type { ToolDefinition } from '@/types';

export const objectRemoveTool: ToolDefinition = {
  id: 'tool_object_remove',
  slug: {
    en: 'remove-object',
    ro: 'elimina-obiect',
  },
  name: {
    en: 'Remove Object',
    ro: 'Elimină obiect',
  },
  category: 'object_remove',
  type: 'ai',
  creditsCost: OBJECT_REMOVE_CREDIT_COST,
  enabledOnPlans: ['free', 'basic', 'starter', 'pro'],
  processorConfig: {
    aiProvider: 'replicate',
    aiModelId: 'black-forest-labs/flux-fill-pro',
    aiWebhookPath: '/api/webhooks/ai-provider',
  },
  limits: {
    maxUploadMB: { free: 10, basic: 10, starter: 25, pro: 50 },
    acceptedFormats: ['image/png', 'image/jpeg', 'image/webp'],
  },
  seo: {
    translations: {
      en: {
        title: 'Remove Object from Photo – AI Magic Eraser Online',
        metaDescription:
          'Paint over unwanted objects, people, or text and let AI inpaint the area seamlessly. Browser-based magic eraser for product photos, travel shots, and social content.',
        h1: 'Remove Object (Magic Eraser)',
        intro:
          'Upload a photo, mark the object with brush or rectangle selection, then remove it or replace it with AI — no Photoshop required.',
        howItWorks:
          'Mark the object with the brush or selection tool. In Remove mode, AI rebuilds the area from surrounding pixels. In Replace mode, describe what should fill the selection.',
        useCases: [
          'Remove photobombers or strangers from travel photos',
          'Erase price tags, stickers, or power lines from product shots',
          'Clean up logos, timestamps, or distracting clutter',
        ],
        aiExplanation: [
          'Brush or click selection — mark precisely what to edit',
          'Remove mode — erases the selection and fills from surrounding scene',
          'Replace mode — generates new content from your description',
          'Edge blending — soft transitions so edits do not look pasted',
        ],
        benefits: [
          'Magic eraser without desktop software',
          'Brush control for precise selections',
          'Works on products, people, text, and small distractions',
          '8 credits per edit — high margin AI tool',
          'Privacy-first — files deleted within hours',
        ],
        faq: [
          {
            question: 'How do I select what to remove?',
            answer:
              'Use the brush to paint over the object, or switch to Click to select a connected area. Use the eraser to refine edges. The red overlay shows your selection.',
          },
          {
            question: 'What is the difference between Remove and Replace?',
            answer:
              'Remove erases the selection and reconstructs the area from surrounding pixels — ideal for magic eraser use cases. Replace fills the selection with new content based on your text description, similar to Canva.',
          },
          {
            question: 'What can I remove?',
            answer:
              'People, objects, text, wires, reflections, and small distractions work best. Very large subjects covering most of the frame may need multiple passes.',
          },
          {
            question: 'How many credits does it cost?',
            answer: 'Object removal costs 8 credits per image — includes AI inpainting for the masked area.',
          },
          {
            question: 'Can I undo the brush strokes?',
            answer:
              'Use the eraser mode to subtract from your mask, or tap Clear mask to start over before processing.',
          },
          {
            question: 'What format is the output?',
            answer: 'Results export as high-quality JPEG, optimized for upload and sharing.',
          },
        ],
        keywords: [
          'remove object from photo',
          'magic eraser online',
          'ai object removal',
          'inpainting tool',
          'erase object from image',
        ],
      },
      ro: {
        title: 'Elimină obiect din poză – Magic Eraser AI online',
        metaDescription:
          'Pictează peste obiectele, persoanele sau textul nedorit și lasă AI-ul să reconstruiască zona în mod natural. Eliminare obiecte în browser pentru produse, travel și social media.',
        h1: 'Elimină obiect (Magic Eraser)',
        intro:
          'Încarcă o poză, pictează peste elementul pe care vrei să-l elimini și descarcă imaginea finală, cu fundalul reconstruit în mod natural — fără Photoshop.',
        howItWorks:
          'Marchează obiectul pe care vrei să îl elimini sau să îl înlocuiești. În modul Eliminare, AI reconstruiește automat fundalul. În modul Înlocuire, descrii ce dorești să apară în locul selecției.',
        useCases: [
          'Elimină persoane sau obiecte nedorite din fotografii',
          'Elimină etichete, stickere sau fire de curent din fotografiile produselor',
          'Elimină logo-uri, marcaje de timp și alte elemente care distrag atenția',
        ],
        aiExplanation: [
          'Pensulă sau Click — selectezi rapid și precis zona de editat',
          'Mod Eliminare — elimină obiectul și reconstruiește fundalul în mod natural',
          'Mod Înlocuire — generează un element nou pe baza descrierii tale',
          'Rafinare inteligentă a marginilor — integrare naturală, fără urme vizibile',
        ],
        benefits: [
          'Eliminare inteligentă a obiectelor direct din browser',
          'Control precis cu pensula pentru selecții exacte',
          'Elimină obiecte, persoane, texte și alte elemente nedorite din imagini',
          'Consumă 8 credite pentru fiecare editare',
          'Fișierele încărcate sunt șterse automat după câteva ore pentru protejarea confidențialității',
        ],
        faq: [
          {
            question: 'Cum selectez obiectul de eliminat?',
            answer:
              'Folosește pensula pentru a marca obiectul pe care vrei să îl editezi sau comută la modul Click pentru a selecta rapid o zonă conectată. Dacă este nevoie, folosește radiera pentru a ajusta selecția. Zona evidențiată cu roșu reprezintă selecția care va fi procesată.',
          },
          {
            question: 'Care e diferența între Eliminare și Înlocuire?',
            answer:
              'Elimină obiectul selectat și reconstruiește fundalul în mod natural. Înlocuiește zona selectată cu un element nou, descris de tine.',
          },
          {
            question: 'Ce pot elimina?',
            answer:
              'Persoane, obiecte, text, fire, reflexii și distrageri mici funcționează cel mai bine. Subiecți foarte mari care acoperă majoritatea cadrului pot necesita mai multe treceri.',
          },
          {
            question: 'Câte credite costă?',
            answer: 'Eliminarea obiectului costă 8 credite per imagine.',
          },
          {
            question: 'Pot anula tușele cu pensula?',
            answer:
              'Folosește modul radieră pentru a scădea din mască sau apasă Șterge masca înainte de procesare.',
          },
          {
            question: 'În ce format e exportul?',
            answer: 'Rezultatele se exportă ca JPEG de calitate, optimizat pentru upload și partajare.',
          },
        ],
        keywords: [
          'elimina obiect din poza',
          'magic eraser online',
          'stergere obiect ai',
          'inpainting poza',
          'sterge obiect imagine',
        ],
      },
    },
  },
  icon: 'Eraser',
  enabled: true,
  order: 8,
  badge: 'new',
};
