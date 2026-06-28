---
slug: prepare-images-for-wordpress
locale: ro
publishedAt: 2026-06-29
seoTitle: Cum pregătești imagini pentru WordPress (Ghid 2026)
title: Cum pregătești imagini pentru WordPress
metaDescription: Pregătește imagini WordPress și WooCommerce — limite upload, thumbnails auto, dimensiuni recomandate, plugin-uri WebP, imagini featured și workflow comprimă înainte de upload.
ogTitle: Cum pregătești imagini pentru WordPress
ogDescription: Pregătire imagini WordPress pentru blog și WooCommerce — dimensiuni thumbnail, srcset, lazy load, alt text, WebP manual vs plugin și pipeline redimensionare-compresie PixiqueAI.
excerpt: WordPress creează automat cinci sau mai multe copii la fiecare upload. Ce încarci tu controlează calitatea și balonarea stocării. Iată cum pregătești imaginile înainte de Media Library.
ctaHeading: Comprimă înainte de upload WordPress
ctaBody: Redimensionează la lățimea conținutului temei, comprimă o dată și exportă WebP sau JPEG gata pentru Media Library — evită thumbnails uriașe din fișiere cameră 6000 px.
ctaButton: Deschide Compresor imagini
ctaToolSlug: compresie-poze
faq: [{"question":"Ce dimensiune încarc imagini în WordPress?","answer":"Încarcă la 1,5×–2× lățimea conținutului temei — tipic 1200–1600 px lățime blog, 2048 px galerii WooCommerce. WordPress generează dimensiuni mai mici automat."},{"question":"WordPress comprimă imaginile la upload?","answer":"WordPress generează thumbnail, medium, large și full. Calitatea JPEG e filtrabilă (~82 default). Plugin-urile pot adăuga WebP. Pre-compresia înainte de upload îți dă control."},{"question":"Plugin WebP sau pre-conversie manuală?","answer":"Ambele merg. Pre-conversia externă asigură calitate consistentă. Plugin-urile automatizează la upload — util pentru biblioteci mari existente."},{"question":"Ce dimensiune galerie WooCommerce?","answer":"Aliniat cu Shopify: 2048×2048 px pătrat sau dimensiunea documentată de temă."},{"question":"Cum evit imagini blur WordPress?","answer":"Încarcă lățime pixel suficientă pentru afișare × retina (2×). Nu te baza pe WordPress pentru upscale — folosește upscale AI pe surse mici dacă e nevoie."},{"question":"Elimin EXIF înainte de upload WordPress?","answer":"Eliminarea EXIF reduce dimensiunea fișierului și date GPS din URL-uri media publice. Vezi ghidul EXIF."}]
relatedLinks: [{"href":"/ro/blog/compress-product-images-without-losing-quality","label":"Comprimă imagini produs"},{"href":"/ro/blog/shopify-product-image-size","label":"Dimensiune imagini Shopify"},{"href":"/ro/blog/how-to-optimize-images-for-seo","label":"Optimizare imagini SEO"},{"href":"/ro/compresie-poze","label":"Compresor imagini"}]
---

WordPress alimentează bloguri, site-uri business și magazine WooCommerce — și fiecare upload declanșează o fabrică automată de derivate. Thumbnail, medium, large, full — plus dimensiuni temă. Încarcă o poză 24 MP și WordPress stochează jumătate de duzină fișiere masive pe care nu le afișezi niciodată.

Pregătirea **înainte** de Media Library e optimizarea cu cel mai mare efect pe care mulți proprietari o sar. Acest ghid acoperă WordPress și WooCommerce 2026: limite upload, dimensiuni auto, dimensiuni recomandate, plugin WebP vs manual, featured, galerii produs, alt text, lazy load, ordine comprimă-redimensionare.

## Cum procesează WordPress upload-urile

La upload, WordPress:

1. Stochează **originalul** (scalat dacă depășește pragul 2560 px implicit).
2. Generează **dimensiuni intermediare** — thumbnail (150×150 crop), medium (300 max), medium_large (768), large (1024).
3. Teme și plugin-uri adaugă **dimensiuni extra** — galerie WooCommerce, hero.

Tema alege dimensiuni per layout. **Full** afișează adesea pe post single — doar dacă lățimea upload depășește coloana conținut.

## Dimensiuni upload recomandate

| Caz | Lățime upload | Note |
|-----|---------------|------|
| Imagine inline blog | 1200–1600 px | Conținut × 2 retina |
| Featured / hero | 1600–1920 px | Teme full-width |
| Produs WooCommerce | 2048×2048 | [Ghid catalog](/ro/blog/shopify-product-image-size) |
| Open Graph | 1200×630 | [Dimensiuni Facebook](/ro/blog/facebook-image-sizes) |

Redimensionează cu [Redimensionare poze](/ro/redimensionare-poze) înainte de upload.

## Pragul big image scaling

WordPress 5.3+ scalează original peste **2560 px** cu sufix `-scaled`. Pre-redimensionare evită surprize.

## Pregătire galerie WooCommerce

1. **[Eliminare fundal](/ro/blog/remove-background-from-product-photos)** dacă stil catalog cere.
2. **Crop** pătrat — [Crop imagini](/ro/crop-imagini).
3. **Redimensionare** 2048×2048 — [compresie produse](/ro/blog/compress-product-images-without-losing-quality).
4. **Comprimă** JPEG Q85–90.
5. Upload galerie — prima imagine e thumbnail catalog.

## Plugin-uri WebP vs pre-conversie manuală

**Plugin** (ShortPixel, Imagify, WebP Express):

- Convertește la upload sau bulk optimizează biblioteca.
- Bun pentru 10.000 upload-uri legacy.

**Manual:**

- Control calitate înainte de al doilea pass WordPress.
- [Convertor imagini](/ro/convertor-jpg-png) sau [ghid WebP](/ro/blog/webp-converter-why-use-webp).

Politică format: [cel mai bun format site 2026](/ro/blog/best-image-format-for-websites-2026).

## Imagini featured și hero

Featured afișează în index blog, share social, widget-uri related. Export **1200×630** sau raport hero temă.

## Alt text și accesibilitate

Câmpul alt din Media Library alimentează screen readers și SEO. Ghid: [optimizare imagini SEO](/ro/blog/how-to-optimize-images-for-seo).

## Lazy loading și LCP

WordPress 5.5+ lazy-load implicit. **Hero featured și prima imagine produs** — adesea exclude lazy load (LCP). [Ghid PageSpeed](/ro/blog/how-image-compression-improves-pagespeed).

## srcset și imagini responsive

WordPress generează `srcset` automat. Upload la lățime max corectă face intrările srcset utile.

## EXIF și confidențialitate

URL-uri Media Library publice. EXIF poate conține GPS — elimină înainte de upload. [Ghid EXIF](/ro/blog/what-is-exif-data).

## Limite hosting

**upload_max_filesize** PHP — 2–64 MB. Pre-comprimă sub 1 MB blog, sub 2 MB produs.

## Workflow comprimă-înainte-upload

1. Crop/compoziție extern dacă e nevoie.
2. [Redimensionare](/ro/redimensionare-poze) lățime conținut × 2.
3. [Comprimă](/ro/compresie-poze) o dată — Q82–88 blog, Q85–90 produs.
4. Upload Media Library.
5. Setează alt text.
6. Inserează — Large sau Full potrivit, nu mereu Full oversized.

## Greșeli frecvente WordPress

**Upload original cameră** — Balonare stocare.

**Full când Large suficient** — Fișier mai mare decât coloana.

**Fără alt text** — Pierdere accesibilitate și SEO.

**Rapoarte mixte WooCommerce grid** — Crop temă inconsistent.

## Rezumat PixiqueAI WordPress

Blog: crop → resize 1400 px → comprimă Q85 → upload Featured + inline.

WooCommerce: [pipeline decupaj produs](/ro/blog/remove-background-from-product-photos) → 2048 pătrat → [compresie produse](/ro/blog/compress-product-images-without-losing-quality) → galerie.

## Concluzie

Pregătirea WordPress înseamnă **dimensiune corectă înainte de upload**. Lasă WordPress să genereze thumbnails din master-e sanatoase; comprimă o dată; setează alt text. Teoria generală: [comprimă fără pierdere](/ro/blog/compress-images-without-losing-quality).
