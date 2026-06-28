import type { Locale } from '@/i18n';

export interface LandingFaqItem {
  question: string;
  answer: string;
}

export const LANDING_FAQ_BY_LOCALE: Record<Locale, LandingFaqItem[]> = {
  en: [
    {
      question: 'What is PixiqueAi?',
      answer:
        'PixiqueAi is an all-in-one image toolkit in your browser. Upscale with AI, remove backgrounds, blur faces for privacy, compress, convert formats, crop, and resize — no software to install.',
    },
    {
      question: 'Is it free to try?',
      answer:
        'Yes. The free plan includes 3 credits per day with no credit card required. Upgrade when you need more credits, watermark-free downloads, or batch processing on Pro.',
    },
    {
      question: 'Do I need to install anything?',
      answer:
        'No. Upload from any modern browser, we process in the cloud (or in your browser for face blur), and you download the result in seconds.',
    },
    {
      question: 'How do credits work?',
      answer:
        'Instant tools — resize, compress, convert, and crop — cost 1 credit each. AI tools — upscale, background removal, and face blur — cost 5 credits each. Credits reset daily on the free plan or monthly on paid plans.',
    },
    {
      question: 'How long do you keep my photos?',
      answer:
        'All uploaded and processed files are permanently deleted within 4 hours. We do not archive your images. Download your results as soon as processing finishes — they cannot be recovered after deletion.',
    },
    {
      question: 'Can I come back tomorrow and download again?',
      answer:
        'No. Files are removed automatically within 4 hours of upload or processing. Save your downloads locally if you need them later. Re-processing the same image will use credits again.',
    },
    {
      question: 'Do you use my images to train AI models?',
      answer:
        'Never. Your photos are used only to deliver the result you requested. We do not use uploads for advertising, profiling, or model training.',
    },
    {
      question: 'What file formats are supported?',
      answer:
        'Most tools accept PNG, JPG, and WebP. Convert and compress also support AVIF. Each tool page lists exact format limits and maximum file size for your plan.',
    },
    {
      question: 'What is the difference between Free and paid plans?',
      answer:
        'Free includes watermarked previews and 3 credits per day. Paid plans remove the watermark, increase monthly credits, raise upload size limits, and unlock higher export quality. Pro adds batch processing (up to 10 images).',
    },
    {
      question: 'Can I process many images at once?',
      answer:
        'Yes, on the Pro plan. Batch mode lets you upload and process up to 10 images in one go, then download them individually or as a ZIP file.',
    },
    {
      question: 'Can I use the results for my business or clients?',
      answer:
        'Yes. You may use processed outputs however you need — personal projects, client work, e-commerce, or advertising. You retain rights to your content; PixiqueAi only processes the files you upload.',
    },
    {
      question: 'What happens if processing fails?',
      answer:
        'If a job fails before a usable result is delivered, your credits are refunded automatically. You can retry with the same or adjusted settings.',
    },
    {
      question: 'How does automatic face blur work?',
      answer:
        'Choose automatic mode to blur every detected face, or custom mode to blur or exclude a specific person using a reference photo. Face detection runs in your browser for speed and privacy; only the blurred result is uploaded.',
    },
    {
      question: 'Where is my data stored?',
      answer:
        'Account data and files are stored on secure cloud infrastructure (Supabase, EU-capable regions). All transfers use encrypted HTTPS connections.',
    },
  ],
  ro: [
    {
      question: 'Ce este PixiqueAi?',
      answer:
        'PixiqueAi e un toolkit complet pentru imagini, direct în browser. Upscale AI, eliminare fundal, blur fețe pentru confidențialitate, compresie, conversie format, crop și redimensionare — fără instalare.',
    },
    {
      question: 'Pot încerca gratuit?',
      answer:
        'Da. Planul gratuit include 3 credite pe zi, fără card bancar. Fă upgrade când ai nevoie de mai multe credite, descărcări fără watermark sau procesare în lot pe Pro.',
    },
    {
      question: 'Trebuie să instalez ceva?',
      answer:
        'Nu. Încarci din orice browser modern, procesăm în cloud (sau în browser la blur fețe) și descarci rezultatul în câteva secunde.',
    },
    {
      question: 'Cum funcționează creditele?',
      answer:
        'Uneltele instant — redimensionare, compresie, conversie și crop — costă 1 credit fiecare. Uneltele AI — upscale, eliminare fundal și blur fețe — costă 5 credite fiecare. Creditele se resetează zilnic pe planul gratuit sau lunar pe planurile plătite.',
    },
    {
      question: 'Cât timp păstrați pozele mele?',
      answer:
        'Toate fișierele încărcate și procesate sunt șterse permanent în cel mult 4 ore. Nu arhivăm imaginile tale. Descarcă rezultatele imediat după procesare — nu pot fi recuperate după ștergere.',
    },
    {
      question: 'Pot reveni mâine să descarc din nou?',
      answer:
        'Nu. Fișierele se șterg automat în cel mult 4 ore de la încărcare sau procesare. Salvează descărcările local dacă le mai ai nevoie. Reprocesarea aceleiași imagini consumă credite din nou.',
    },
    {
      question: 'Folosiți pozele mele pentru antrenarea AI?',
      answer:
        'Niciodată. Fotografiile tale sunt folosite doar pentru rezultatul pe care l-ai cerut. Nu folosim încărcările pentru publicitate, profilare sau antrenarea modelelor.',
    },
    {
      question: 'Ce formate de fișiere sunt acceptate?',
      answer:
        'Majoritatea uneltelor acceptă PNG, JPG și WebP. Conversia și compresia acceptă și AVIF. Fiecare pagină de unealtă listează formatele exacte și limita de mărime pentru planul tău.',
    },
    {
      question: 'Care e diferența între planul Gratuit și cel plătit?',
      answer:
        'Gratuit include preview cu watermark și 3 credite/zi. Planurile plătite elimină watermark-ul, cresc creditele lunare, limitele de upload și calitatea exportului. Pro adaugă procesare în lot (până la 10 imagini).',
    },
    {
      question: 'Pot procesa multe imagini odată?',
      answer:
        'Da, pe planul Pro. Modul lot îți permite să încarci și procesezi până la 10 imagini dintr-o dată, apoi să le descarci individual sau ca arhivă ZIP.',
    },
    {
      question: 'Pot folosi rezultatele pentru afacerea mea sau clienți?',
      answer:
        'Da. Poți folosi rezultatele procesate cum dorești — personal, comercial, pentru clienți sau magazin online. Păstrezi drepturile asupra conținutului tău; PixiqueAi doar procesează fișierele pe care le încarci.',
    },
    {
      question: 'Ce se întâmplă dacă procesarea eșuează?',
      answer:
        'Dacă un job eșuează înainte de a livra un rezultat utilizabil, creditele îți sunt returnate automat. Poți reîncerca cu aceleași setări sau cu altele.',
    },
    {
      question: 'Cum funcționează blur-ul automat pe fețe?',
      answer:
        'Alege modul automat pentru a blura toate fețele detectate, sau modul personalizat pentru a blura sau exclude o anumită persoană folosind o poză de referință. Detectarea rulează în browser, pentru viteză și confidențialitate; doar rezultatul blurat este încărcat.',
    },
    {
      question: 'Unde sunt stocate datele mele?',
      answer:
        'Datele de cont și fișierele sunt stocate pe infrastructură cloud securizată (Supabase, regiuni compatibile UE). Toate transferurile folosesc conexiuni HTTPS criptate.',
    },
  ],
};
