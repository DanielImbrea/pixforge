---
slug: prepare-images-for-wordpress
locale: en
publishedAt: 2026-06-29
seoTitle: How to Prepare Images for WordPress (2026 Guide)
title: How to Prepare Images for WordPress
metaDescription: Prepare images for WordPress and WooCommerce — upload size limits, auto-generated thumbnails, recommended dimensions, WebP plugins, featured images, and compress-before-upload workflow.
ogTitle: How to Prepare Images for WordPress
ogDescription: WordPress image prep for blogs and WooCommerce stores — thumbnail sizes, srcset, lazy load, alt text, plugin vs manual WebP, and PixiqueAI resize-compress pipeline.
excerpt: WordPress creates five or more copies of every upload automatically. What you upload still controls quality and storage bloat. Here is how to prep images before they hit the media library.
ctaHeading: Compress before WordPress upload
ctaBody: Resize to your theme's content width, compress once, and export WebP or JPEG ready for Media Library upload — avoid generating oversized thumbnails from 6000 px camera files.
ctaButton: Open Image Compressor
ctaToolSlug: image-compressor
faq: [{"question":"What size should I upload images to WordPress?","answer":"Upload at 1.5× to 2× your theme's content width — typically 1200–1600 px wide for blog content, 2048 px for WooCommerce product galleries. WordPress generates smaller sizes automatically; oversized uploads waste storage and slow backups."},{"question":"Does WordPress compress uploaded images?","answer":"WordPress generates thumbnail, medium, large, and full-size variants. JPEG quality is filterable (default ~82). Plugins may add WebP conversion. Pre-compressing before upload gives you control before WordPress applies its defaults."},{"question":"Should I use a WebP plugin or pre-convert images?","answer":"Either works. Pre-converting with an external tool ensures consistent quality before upload. WebP plugins (ShortPixel, Imagify, WebP Express) automate on upload — useful for large existing libraries. See our WebP and format guides for strategy."},{"question":"What image size for WooCommerce product galleries?","answer":"Match Shopify guidance: 2048×2048 px square or theme-documented size. WooCommerce uses WordPress media sizes for catalog thumbnails — consistent upload dimensions keep shop grids uniform."},{"question":"How do I avoid blurry WordPress images?","answer":"Upload sufficient pixel width for display size × retina (2×). Do not upload tiny images stretched by CSS. Do not rely on WordPress to upscale — use AI upscale on small sources before upload if needed."},{"question":"Should I strip EXIF before WordPress upload?","answer":"Stripping EXIF reduces file size and removes GPS privacy data from public media URLs. Most compression tools strip metadata on export. See our EXIF guide for details."}]
relatedLinks: [{"href":"/en/blog/compress-product-images-without-losing-quality","label":"Compress product images"},{"href":"/en/blog/shopify-product-image-size","label":"Shopify product image size"},{"href":"/en/blog/how-to-optimize-images-for-seo","label":"Optimize images for SEO"},{"href":"/en/image-compressor","label":"Image Compressor tool"}]
---

WordPress powers blogs, business sites, and WooCommerce stores — and every image you upload triggers an automatic factory of derivatives. Thumbnail, medium, large, full — sometimes theme-specific sizes too. Upload a 24 MP phone photo and WordPress stores half a dozen massive files you'll never display.

Preparing images **before** Media Library upload is the highest-leverage optimization most site owners skip. This guide covers WordPress and WooCommerce prep for 2026: upload limits, auto-generated sizes, recommended dimensions, WebP plugin versus manual workflow, featured images, product galleries, alt text, lazy loading interaction, and compress-resize order. For general web sizing, see [best image size for faster loading](/en/blog/best-image-size-for-faster-website-loading); for SEO, see [optimize images for SEO](/en/blog/how-to-optimize-images-for-seo).

## How WordPress processes uploads

On upload, WordPress:

1. Stores the **original** (scaled down if over 2560 px big image threshold by default).
2. Generates registered **intermediate sizes** — typically thumbnail (150×150 crop), medium (300 max), medium_large (768), large (1024×1024 max height/width).
3. Themes and plugins register **additional sizes** — WooCommerce gallery, hero banners, card thumbnails.

Your theme picks sizes for each layout. The **full** size often displays on single posts — but only if upload width exceeds content column.

Understanding this prevents uploading 5000 px files "for quality" when the theme never serves beyond 1200 px width.

## Recommended upload dimensions by use case

| Use case | Upload width | Notes |
|----------|--------------|-------|
| Blog inline image | 1200–1600 px | Match content width × 2 for retina |
| Featured / hero | 1600–1920 px | Full-width themes need upper range |
| WooCommerce product | 2048×2048 | Align with [Shopify/woo catalog guide](/en/blog/shopify-product-image-size) |
| Open Graph / social | 1200×630 | Separate export — [Facebook sizes](/en/blog/facebook-image-sizes) |
| Icons / logos | SVG preferred; PNG at display × 2 | |

Resize with [Image Resizer](/en/image-resizer) to exact targets before upload.

## The big image scaling threshold

WordPress 5.3+ scales originals over **2560 px** on longest edge to `-scaled` suffix. You lose direct access to full resolution in admin — still stored but confusing for editors.

Pre-resize to intended delivery max avoids WordPress surprise scaling and keeps Media Library predictable.

## WooCommerce product gallery prep

WooCommerce product images use WordPress media system:

1. **[Background removal](/en/blog/remove-background-from-product-photos)** if catalog style requires.
2. **Crop** square or theme ratio — [Image Cropper](/en/image-cropper).
3. **Resize** 2048×2048 — consistent with [product compression guide](/en/blog/compress-product-images-without-losing-quality).
4. **Compress** JPEG Q85–90.
5. Upload to product gallery — first image is catalog thumbnail.

Variable products: same dimensions across colorways for grid alignment.

Cross-marketplace sellers also export [Amazon](/en/blog/amazon-product-image-requirements) and [Etsy](/en/blog/etsy-product-image-size-guide) presets from same masters.

## WebP plugins vs manual pre-conversion

**Plugin approach** (ShortPixel, Imagify, EWWW, WebP Express):

- Converts on upload or bulk-optimizes library.
- Serves WebP via rewrite rules or `<picture>`.
- Good for retroactive optimization of 10,000 legacy uploads.

**Manual pre-conversion:**

- Control quality before WordPress second pass.
- Use [Image Converter](/en/image-converter) or [WebP guide](/en/blog/webp-converter-why-use-webp).
- Upload WebP if theme/plugin supports; keep JPEG fallback master in archive.

Site-wide format policy: [best format for websites 2026](/en/blog/best-image-format-for-websites-2026).

## Featured images and theme heroes

Featured image displays in:

- Blog index cards.
- Social share previews (if OG plugin not overriding).
- Related post widgets.

Export at **1200×630** or theme-documented hero ratio. Crop with safe zone for title overlay if theme adds text on hero.

## Alt text and accessibility at upload

WordPress Media Library alt field feeds:

- Screen readers.
- SEO image search.
- Image search traffic.

Add descriptive alt during upload — not filename DSC_0042.jpg. Deep guide: [optimize images for SEO](/en/blog/how-to-optimize-images-for-seo).

## Lazy loading and LCP

WordPress 5.5+ lazy-loads images by default. **Featured hero and first product image** should often opt out of lazy load (theme setting or plugin) — they are LCP candidates.

Compressing heroes aggressively hurts LCP scores less than oversized uncompressed files — balance with [PageSpeed guide](/en/blog/how-image-compression-improves-pagespeed).

## srcset and responsive images

WordPress auto-generates `srcset` from registered sizes. Uploading only at correct max width ensures srcset entries are useful — not five sizes all downscaled from one 6000 px monster.

For manual control, some themes prefer exact width uploads per breakpoint — advanced; default WordPress srcset works when upload width is sane.

## EXIF and privacy

Public Media Library URLs expose uploaded files. EXIF may contain GPS and camera serial — strip before upload. [EXIF guide](/en/blog/what-is-exif-data). [Image Compressor](/en/image-compressor) typically strips on export.

## Upload limits and hosting constraints

Shared hosts often limit:

- **PHP upload_max_filesize** — 2–64 MB.
- **Memory** for image processing — huge PNG fails silently.

Pre-compress to under 1 MB for blog, under 2 MB for product — avoids timeout and fits backup windows.

## Compress-before-upload workflow

Standard pipeline for any WordPress image:

1. Edit crop/composition in external tool if needed.
2. [Resize](/en/image-resizer) to theme content width × 2.
3. [Compress](/en/image-compressor) once — JPEG Q82–88 blog, Q85–90 product.
4. Optional WebP duplicate for plugin-less modern serving.
5. Upload to Media Library.
6. Set alt text and title.
7. Insert into post/product — use "Large" or "Full" size appropriately, not always Full if oversized.

Never upload → edit in WordPress → re-upload — duplicates media entries.

## Common WordPress image mistakes

**Uploading camera originals** — Storage bloat, slow backups, no visual gain.

**Using Full size in content when Large suffices** — Serves bigger file than column width.

**Skipping alt text** — Accessibility and SEO loss.

**Double WebP conversion** — Plugin re-compresses already crushed files.

**Mixing aspect ratios in WooCommerce grid** — Theme crops inconsistently.

## PixiqueAI WordPress prep summary

Blog post: crop → resize 1400 px wide → compress Q85 → upload Featured + inline.

WooCommerce: [product cutout pipeline](/en/blog/remove-background-from-product-photos) → 2048 square → [product compress](/en/blog/compress-product-images-without-losing-quality) → upload gallery.

## Plugin compatibility note

Page builders (Elementor, Divi) may register custom image sizes — check theme docs and add 100–200 px buffer to resize targets.

## Putting it together

WordPress image prep means **right-sizing before upload**, not fixing bloat after. Let WordPress generate thumbnails from sane masters; compress once; set alt text; align WooCommerce with marketplace export presets. General compression theory lives in [compress without losing quality](/en/blog/compress-images-without-losing-quality) — this guide applies it to the Media Library factory that runs on every upload.
