import type { Locale } from '@/i18n';

export interface BlogSection {
  heading: string;
  paragraphs: string[];
}

export interface BlogPostTranslation {
  title: string;
  metaDescription: string;
  excerpt: string;
  sections: BlogSection[];
}

export interface BlogPost {
  slug: string;
  publishedAt: string;
  translations: Record<Locale, BlogPostTranslation>;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'ai-image-upscaling-guide',
    publishedAt: '2025-06-01',
    translations: {
      en: {
        title: 'How to Upscale Images Without Losing Quality (AI Guide)',
        metaDescription:
          'Learn how AI upscaling restores detail, when to use 2× vs 4×, and how to enhance blurry photos, old scans, and low-resolution screenshots.',
        excerpt:
          'AI upscaling rebuilds missing detail instead of stretching pixels. Here is when it works best and how to get sharp results.',
        sections: [
          {
            heading: 'Why regular resizing blurs images',
            paragraphs: [
              'Traditional resize tools interpolate existing pixels. When you enlarge a small photo, the software guesses what should fill the gaps — which produces softness, jagged edges, and compression artifacts.',
              'AI upscalers analyze patterns in your image — textures, edges, faces, text — and synthesize plausible detail. The result looks sharper because new information is added, not just stretched.',
            ],
          },
          {
            heading: 'Best use cases for AI upscaling',
            paragraphs: [
              'Blurry phone photos that need print or hero-banner size.',
              'Old family scans and low-resolution archives.',
              'Screenshots and UI captures where text must stay readable.',
              'Product photos sourced from suppliers at small dimensions.',
            ],
          },
          {
            heading: '2× vs 4×: which scale to choose',
            paragraphs: [
              '2× is ideal when the source is already decent and you only need a modest boost — especially for screenshots with small text.',
              '4× works best on very small sources where aggressive detail reconstruction is required. Going too far on already-large images can introduce artificial texture.',
              'Smart routing (like PixelForge uses) picks the scale and model based on image type so you do not have to guess.',
            ],
          },
          {
            heading: 'Try it in PixelForge',
            paragraphs: [
              'Upload any JPG, PNG, or WebP to the AI Image Upscaler. Choose Smart mode for automatic routing, or pick 2× / 4× manually. Processing runs in the cloud — no install required.',
            ],
          },
        ],
      },
      ro: {
        title: 'Cum să faci upscale la imagini fără pierdere de calitate (Ghid AI)',
        metaDescription:
          'Află cum upscalarea AI restaurează detaliile, când să folosești 2× vs 4× și cum să îmbunătățești poze neclare, scanări vechi și screenshot-uri.',
        excerpt:
          'Upscalarea AI reconstruiește detalii lipsă în loc să întindă pixelii. Iată când funcționează cel mai bine.',
        sections: [
          {
            heading: 'De ce redimensionarea clasică produce blur',
            paragraphs: [
              'Uneltele tradiționale interpolă pixelii existenți. Când mărești o poză mică, software-ul ghicește ce ar trebui să umple golurile — rezultatul: softness și artefacte.',
              'Upscalerii AI analizează texturi, margini, fețe și text, apoi sintetizează detalii plauzibile. Rezultatul pare mai clar pentru că se adaugă informație nouă.',
            ],
          },
          {
            heading: 'Cazuri ideale pentru upscalare AI',
            paragraphs: [
              'Poze de telefon neclare care trebuie printate sau folosite ca banner.',
              'Scanări vechi și arhive la rezoluție mică.',
              'Screenshot-uri unde textul trebuie să rămână lizibil.',
              'Poze de produs de la furnizori la dimensiuni mici.',
            ],
          },
          {
            heading: '2× vs 4×: ce scală alegi',
            paragraphs: [
              '2× e ideal când sursa e deja decentă și ai nevoie doar de un boost modest.',
              '4× funcționează pe surse foarte mici unde e nevoie de reconstrucție agresivă de detalii.',
              'Rutarea Smart (ca în PixelForge) alege scala și modelul în funcție de tipul imaginii.',
            ],
          },
          {
            heading: 'Testează în PixelForge',
            paragraphs: [
              'Încarcă JPG, PNG sau WebP în Upscaler AI. Alege modul Smart sau 2× / 4× manual. Procesarea e în cloud — fără instalare.',
            ],
          },
        ],
      },
    },
  },
  {
    slug: 'how-to-remove-background',
    publishedAt: '2025-06-08',
    translations: {
      en: {
        title: 'How to Remove Background from Product Photos',
        metaDescription:
          'Step-by-step guide to clean product cutouts with AI — transparent PNG export, hair and edge refinement, and e-commerce use cases.',
        excerpt:
          'Product listings need clean transparent backgrounds. AI cutout tools deliver studio-quality edges in seconds.',
        sections: [
          {
            heading: 'Why transparent backgrounds matter for e-commerce',
            paragraphs: [
              'Marketplaces and web shops expect consistent product shots on white or transparent backgrounds. Manual masking in Photoshop is slow and expensive at scale.',
              'AI background removers detect the subject, refine edges (including hair and fine details), and export PNG with alpha transparency ready for catalogs.',
            ],
          },
          {
            heading: 'Product mode vs portrait mode',
            paragraphs: [
              'Product mode optimizes hard edges — boxes, bottles, electronics — with crisp outlines.',
              'Portrait mode preserves hair, skin edges, and soft transitions using advanced matting.',
              'Object mode balances both for general assets like icons, furniture, or mixed scenes.',
            ],
          },
          {
            heading: 'Tips for best results',
            paragraphs: [
              'Use good lighting and contrast between subject and background when shooting.',
              'Choose high edge quality for hero images; standard is fine for bulk catalog work.',
              'Export PNG to keep transparency; use JPEG only after placing on a solid background.',
            ],
          },
          {
            heading: 'Remove backgrounds with PixelForge',
            paragraphs: [
              'Upload your product or portrait photo, pick the mode that matches your subject, and download a transparent PNG in seconds. Free tier available to test quality before upgrading.',
            ],
          },
        ],
      },
      ro: {
        title: 'Cum elimini fundalul de la poze de produs',
        metaDescription:
          'Ghid pas cu pas pentru decupaje curate cu AI — PNG transparent, rafinare margini și păr, cazuri e-commerce.',
        excerpt:
          'Listările de produse au nevoie de fundal transparent. Uneltele AI livrează margini de studio în secunde.',
        sections: [
          {
            heading: 'De ce contează fundalul transparent în e-commerce',
            paragraphs: [
              'Marketplace-urile așteaptă poze consistente pe fundal alb sau transparent. Mascarea manuală e lentă și costisitoare.',
              'Eliminatoarele AI detectează subiectul, rafinează marginile și exportă PNG cu transparență alpha.',
            ],
          },
          {
            heading: 'Mod produs vs mod portret',
            paragraphs: [
              'Modul produs optimizează margini dure — cutii, sticle, electronice.',
              'Modul portret păstrează părul și tranzițiile fine cu matting avansat.',
              'Modul obiect echilibrează ambele pentru asset-uri generale.',
            ],
          },
          {
            heading: 'Sfaturi pentru rezultate bune',
            paragraphs: [
              'Folosește lumină bună și contrast între subiect și fundal.',
              'Alege calitate înaltă a marginilor pentru imagini hero.',
              'Exportă PNG pentru transparență; JPEG doar după ce pui pe fundal solid.',
            ],
          },
          {
            heading: 'Elimină fundalul cu PixelForge',
            paragraphs: [
              'Încarcă poza, alege modul potrivit și descarcă PNG transparent în secunde. Plan gratuit pentru testare.',
            ],
          },
        ],
      },
    },
  },
  {
    slug: 'image-compression-guide',
    publishedAt: '2025-06-15',
    translations: {
      en: {
        title: 'Best Image Formats for Web (PNG vs JPG vs WebP vs AVIF)',
        metaDescription:
          'Compare PNG, JPG, WebP, and AVIF for web performance. Learn when to compress photos vs UI screenshots and how to reduce file size without visible quality loss.',
        excerpt:
          'Choosing the right format cuts page weight dramatically. Here is a practical decision guide for developers and marketers.',
        sections: [
          {
            heading: 'PNG vs JPG: the classic trade-off',
            paragraphs: [
              'PNG is lossless and supports transparency — ideal for logos, UI, and graphics with sharp edges.',
              'JPEG is lossy but much smaller for photographs. It does not support transparency, so PNG→JPEG conversions need a background fill.',
            ],
          },
          {
            heading: 'WebP and AVIF: modern web formats',
            paragraphs: [
              'WebP offers strong compression for both photos and graphics. Lossless WebP preserves screenshot text without blur.',
              'AVIF typically beats JPEG and WebP on photo compression at equal visual quality — great for hero images and galleries.',
              'Always provide fallbacks: AVIF → WebP → JPEG for maximum browser coverage.',
            ],
          },
          {
            heading: 'Smart compression without visible loss',
            paragraphs: [
              'Do not use one quality setting for every image. Photos tolerate more compression than screenshots with small text.',
              'Resize before compressing when displaying at smaller dimensions on the page.',
              'Automated routing (photo → AVIF, UI → lossless WebP) saves time and avoids format mistakes.',
            ],
          },
          {
            heading: 'Compress and convert with PixelForge',
            paragraphs: [
              'Use the Image Compressor for smart size reduction and the Image Converter for format optimization with explainable decisions. Both run in the browser with no install.',
            ],
          },
        ],
      },
      ro: {
        title: 'Cele mai bune formate de imagine pentru web (PNG vs JPG vs WebP vs AVIF)',
        metaDescription:
          'Compară PNG, JPG, WebP și AVIF pentru performanță web. Află când comprimi fotografii vs screenshot-uri UI.',
        excerpt:
          'Formatul potrivit reduce drastic greutatea paginii. Ghid practic pentru dezvoltatori și marketeri.',
        sections: [
          {
            heading: 'PNG vs JPG: compromisul clasic',
            paragraphs: [
              'PNG e lossless și suportă transparență — ideal pentru logo-uri și UI.',
              'JPEG e lossy dar mult mai mic pentru fotografii. Nu suportă transparență.',
            ],
          },
          {
            heading: 'WebP și AVIF: formate moderne',
            paragraphs: [
              'WebP oferă compresie bună pentru poze și grafică. WebP lossless păstrează textul din screenshot-uri.',
              'AVIF bate de obicei JPEG și WebP la aceeași calitate vizuală.',
              'Folosește fallback: AVIF → WebP → JPEG.',
            ],
          },
          {
            heading: 'Compresie inteligentă fără pierderi vizibile',
            paragraphs: [
              'Nu folosi aceeași calitate pentru fiecare imagine.',
              'Redimensionează înainte de compresie dacă afișezi la dimensiuni mai mici.',
              'Rutarea automată economisește timp și evită greșeli de format.',
            ],
          },
          {
            heading: 'Comprimă și convertește cu PixelForge',
            paragraphs: [
              'Folosește Compresorul de imagini și Convertorul de format cu decizii explicabile. Totul în browser, fără instalare.',
            ],
          },
        ],
      },
    },
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((post) => post.slug);
}
