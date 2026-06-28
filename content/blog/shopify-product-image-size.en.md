---
slug: shopify-product-image-size
locale: en
publishedAt: 2026-06-28
seoTitle: Best Shopify Product Image Size (2026 Guide)
title: Best Product Image Size for Shopify
metaDescription: Shopify product image dimensions for 2026 — 2048×2048 recommendations, square vs lifestyle, zoom behavior, collection images, file limits, and upload prep workflow.
ogTitle: Best Product Image Size for Shopify
ogDescription: Exact Shopify image sizes for product galleries, collections, and slideshows — plus zoom, CDN, mobile, SEO alt text, and a PixiqueAI resize-compress workflow.
excerpt: Shopify themes zoom into product photos and generate multiple sizes automatically — but what you upload still controls sharpness and page weight. Here are the 2026 dimensions and prep steps that work.
ctaHeading: Resize for Shopify in one step
ctaBody: Upload product photos and resize to 2048×2048 or your theme's target width. Preserve aspect ratio, compress for faster storefront loading, and export JPG or PNG ready for admin upload.
ctaButton: Open Image Resizer
ctaToolSlug: image-resizer
faq: [{"question":"What is the best Shopify product image size in 2026?","answer":"Shopify recommends uploading square images up to 2048×2048 pixels for product galleries. The platform generates smaller variants automatically. Uploading at least 1600 px on the long edge ensures zoom stays sharp on desktop themes."},{"question":"Should Shopify product images be square or rectangular?","answer":"Square 1:1 is the safest default — most themes display product grids as squares. Lifestyle rectangular images work in galleries if your theme supports mixed ratios; check theme docs before batch cropping."},{"question":"What file format should I use for Shopify products?","answer":"JPEG for photographic products on white or lifestyle backgrounds. PNG for transparency or crisp graphics. WebP may be served by some themes or CDN apps — upload high-quality JPG/PNG masters and let optimization plugins handle modern formats."},{"question":"Does Shopify compress uploaded images?","answer":"Yes. Shopify re-encodes uploads and creates multiple sizes (small, medium, large, 2048). Starting from an oversized 6000 px JPEG wastes upload time; resize to 2048 max and compress once before upload for best quality-to-weight ratio."},{"question":"How big can Shopify product image files be?","answer":"Shopify allows uploads up to 20 MB and 4472×4472 pixels, but large files slow admin and storefront. Aim for 200 KB–1 MB per gallery image after compression for typical catalog photos."},{"question":"Do collection images use different sizes?","answer":"Collection featured images display at theme-dependent ratios — often wide banners or squares. Export at 2048 px on the long edge or match your theme's documented collection image ratio."}]
relatedLinks: [{"href":"/en/blog/remove-background-from-product-photos","label":"Remove background from product photos"},{"href":"/en/blog/compress-product-images-without-losing-quality","label":"Compress product images"},{"href":"/en/blog/prepare-images-for-wordpress","label":"Prepare images for WordPress"},{"href":"/en/image-resizer","label":"Image Resizer tool"}]
---

Shopify stores live or die on product photography. Themes enable zoom, swipe galleries, and collection grids — but none of that helps if you upload 6000-pixel phone photos that load slowly or crop unpredictably on mobile.

This guide covers **Shopify-specific** product image dimensions for 2026: recommended 2048×2048 uploads, square versus lifestyle ratios, zoom behavior, collection and slideshow images, file size targets, format choice, CDN delivery, mobile display, and a prep workflow before admin upload. For general responsive sizing theory, see [resize images for any device](/en/blog/resize-images-for-any-device); for web-wide format policy, see [best image format for websites 2026](/en/blog/best-image-format-for-websites-2026).

## How Shopify handles product images

When you upload to a product gallery, Shopify:

- Stores the original (up to limits).
- Generates variants: small (~100 px), medium (~240 px), large (~480 px), and 2048 px versions.
- Serves appropriate sizes via CDN based on theme and device.

You cannot control every derivative, but **your upload is the quality ceiling**. Upload too small and zoom blurs; upload too large and you waste bandwidth before Shopify's second compression pass.

## Recommended product image size: 2048×2048

Shopify's documentation recommends **2048×2048 pixels** maximum for square product images. Practical guidance:

- **Minimum for sharp zoom:** 1600 px on the long edge.
- **Sweet spot:** 2048×2048 square for pack shots and white-background catalog images.
- **Maximum useful:** Beyond 2048, Shopify downscales — no benefit for most themes.

Resize with [Image Resizer](/en/image-resizer) before upload rather than relying on the platform to shrink oversized camera files.

## Square 1:1 vs lifestyle rectangular images

**Square (1:1)** — Default for product grids. Every tile aligns in collection pages. Crop pack shots to square with [Image Cropper](/en/image-cropper) after [background removal](/en/blog/remove-background-from-product-photos).

**Rectangular lifestyle** — In-gallery slides showing product in use. Some themes letterbox non-square images in grid view but display full ratio on product page. Verify your theme (Dawn, Prestige, custom).

**Mixed galleries** — Hero slide square; slides 2–5 lifestyle 4:5 or 16:9. Consistent first slide matters for collection thumbnail.

## Product zoom and sharpness

Desktop themes often magnify on hover or click. Zoom reveals:

- Soft edges from aggressive JPEG compression.
- Upscaled small supplier images — pixelation at 2× zoom.

Workflow: start from largest clean source → cutout → crop square → resize to 2048 → compress at quality 85–90. If source is tiny, [AI upscale](/en/blog/how-to-increase-image-resolution) before resize.

## Collection and featured images

Collection pages use a **featured image** separate from product photos:

- Often displayed as banner or square tile.
- Theme-dependent ratio — check theme settings (commonly 16:9 or 1:1).
- Export at 2048 px long edge minimum.

Slideshow sections on homepage may require 16:9 or custom — duplicate resize presets per section.

## File size and upload limits

Shopify limits: **20 MB** file size, **4472×4472** pixels maximum. Targets for catalog health:

| Image type | Target dimensions | Target file size |
|------------|-------------------|------------------|
| Main product square | 2048×2048 | 150 KB–800 KB JPEG |
| Lifestyle gallery | 2048 long edge | 200 KB–1 MB JPEG |
| PNG transparent | 2048×2048 | 500 KB–2 MB (compress after) |

See [compress product images](/en/blog/compress-product-images-without-losing-quality) for batch settings.

## JPG, PNG, and WebP on Shopify

**JPEG** — Default for photos. Smallest files; no transparency.

**PNG** — Transparent product cutouts on colored theme sections. Compress after resize — PNGs run large.

**WebP** — Some themes and apps (TinyIMG, Crush.pics) convert on upload or serve via CDN. Upload quality JPG masters; let apps generate WebP unless you pre-convert with [WebP converter guide](/en/blog/webp-converter-why-use-webp).

## Mobile storefront display

Mobile product pages stack gallery vertically. Images display near full viewport width (~390–430 px CSS). Retina needs ~800–1200 px source width — well within 2048 upload. Oversized 4000 px uploads do not improve mobile; they slow LCP.

Link to [PageSpeed compression guide](/en/blog/how-image-compression-improves-pagespeed) for storefront performance.

## SEO: alt text and filenames

Shopify product SEO benefits from descriptive alt text on gallery images — not dimension-related but part of upload prep:

- Filename: `brand-product-color-variant.jpg`
- Alt: "Blue ceramic mug 350ml side view on white"

Deep SEO coverage: [optimize images for SEO](/en/blog/how-to-optimize-images-for-seo).

## Preparing cutouts for Shopify themes

After [background removal](/en/blog/remove-background-from-product-photos):

1. Export transparent PNG or white background JPEG.
2. Crop to 1:1 with breathing room — product fills ~80% of frame.
3. Resize to 2048×2048.
4. Compress PNG or export JPEG Q88.
5. Upload gallery slot 1 first (thumbnail source on many themes).

## Multi-variant and colorway images

Each variant (size, color) may need distinct gallery sets. Keep dimension and compression settings identical across variants so collection pages load uniformly.

## Common Shopify image mistakes

**Uploading raw camera files** — 6000 px, 8 MB, wrong color profile.

**Skipping square crop** — Product centered in landscape frame; theme crops top/bottom in grid.

**Heavy PNG for photo products** — Use JPEG on white after cutout flatten.

**Different sizes per SKU** — Inconsistent zoom behavior across catalog.

**Re-uploading Instagram downloads** — Double compression; blurry zoom.

## PixiqueAI Shopify prep workflow

Source photo → [Background Remover](/en/background-remover) Product mode → crop 1:1 → [Image Resizer](/en/image-resizer) 2048×2048 → [Image Compressor](/en/image-compressor) → upload to Shopify admin → add alt text.

For Amazon and Etsy dimensions in the same catalog, cross-reference [Amazon requirements](/en/blog/amazon-product-image-requirements) and [Etsy size guide](/en/blog/etsy-product-image-size-guide).

## Quick reference table

| Asset | Size | Format |
|-------|------|--------|
| Product gallery | 2048×2048 (1:1) | JPEG or PNG |
| Zoom minimum | 1600+ px long edge | JPEG Q85–90 |
| Collection featured | 2048 long edge, theme ratio | JPEG |
| Transparent cutout | 2048×2048 | PNG → compress |

## Putting it together

Shopify image size is not mysterious: **2048 px square JPEG** (or compressed PNG for transparency) covers most stores in 2026. Resize and compress **before** upload to control quality; let Shopify generate derivatives. Pair this guide with product cutout and compression articles for a complete catalog pipeline.
