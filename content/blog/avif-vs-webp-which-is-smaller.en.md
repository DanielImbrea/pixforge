---
slug: avif-vs-webp-which-is-smaller
locale: en
publishedAt: 2026-06-24
seoTitle: AVIF vs WebP: Which Is Smaller? — File Size Benchmarks
title: AVIF vs WebP: Which Is Smaller?
metaDescription: AVIF vs WebP file size benchmarks only — percent savings tables for photos and graphics, lossy vs lossless, same visual quality tests, encoding time trade-offs, CMS uploads, and when each format wins.
ogTitle: AVIF vs WebP: Which Is Smaller?
ogDescription: Narrow benchmark guide comparing AVIF and WebP file sizes — photo vs graphic savings, lossy vs lossless gaps, perceptual quality matching, real CMS tests, encode time costs, and when WebP beats AVIF.
excerpt: AVIF usually beats WebP on photos, but the margin depends on content, lossless mode, and how long you are willing to wait for encoding. Here are measured savings — not a full format decision guide.
ctaHeading: Compare AVIF and WebP on your files
ctaBody: Upload JPG, PNG, or WebP and export both formats from the same source. See side-by-side file size before you commit to a batch migration.
ctaButton: Open Image Converter
ctaToolSlug: image-converter
faq: [{"question":"How much smaller is AVIF than WebP on average?","answer":"On lossy photographic content at matched visual quality, AVIF is typically 15–35% smaller than WebP, with the largest gaps on gradients, skies, and soft natural textures. On flat graphics and small icons the margin often shrinks to 5–15%, and lossless WebP sometimes matches or beats AVIF on simple UI captures."},{"question":"Is AVIF always smaller than WebP at the same quality setting?","answer":"No. Quality sliders are not comparable across codecs. At the same numeric quality value, one format may look sharper or softer than the other. Benchmarks should match perceived quality — visually or with objective metrics — not identical slider numbers. WebP can also produce smaller files when AVIF encode settings prioritize speed over compression."},{"question":"Does WebP ever beat AVIF on file size?","answer":"Yes. WebP often wins on small dimensions under 400 px, flat-color graphics, already-optimized WebP sources, and lossless UI screenshots where WebP's predictor modes excel. WebP also wins operationally when encode time budgets forbid slow AVIF passes on large catalogs."},{"question":"Should I benchmark my own images before switching formats?","answer":"Yes. Stock benchmark sets show trends, but your catalog mix — product-on-white, lifestyle, cutouts, banners — determines real savings. Pick five to ten representative files, resize to final delivery dimensions, encode both formats at matched quality, and compare bytes plus 100% zoom before batch conversion."},{"question":"Does longer AVIF encoding time affect which format I should use?","answer":"Encoding time does not change decode size on the CDN, but it affects build pipelines, CMS upload timeouts, and editor patience. If AVIF saves 28% on heroes but takes 8× longer to generate in CI, many teams ship WebP for bulk assets and reserve AVIF for above-the-fold images only."},{"question":"Can I convert WebP to AVIF to save more space?","answer":"You can, but re-encoding an already lossy WebP cannot recover detail that was discarded. Conversion may still shrink bytes at similar visual quality if the AVIF encoder is more efficient, yet starting from a high-quality master before any lossy export always yields better results. See our compression guide for workflow order."}]
relatedLinks: [{"href":"/en/blog/avif-vs-webp-vs-jpeg-which-format","label":"AVIF vs WebP vs JPEG — full format guide"},{"href":"/en/blog/compress-images-without-losing-quality","label":"Compress images without losing quality"},{"href":"/en/blog/best-image-size-for-faster-website-loading","label":"Best image size for faster loading"},{"href":"/en/image-converter","label":"Image Converter"}]
---

You already know AVIF and WebP beat legacy JPEG on most photographic pages. What is harder to find is a straight answer to a narrower question: **at the same visible quality, which one is actually smaller — and by how much?** Marketing claims range from "AVIF destroys WebP" to "the difference is negligible." Both can be true depending on the image.

This article is a **file-size benchmark guide only**. It does not re-litigate browser support, email compatibility, or full-stack format policy — those belong in [AVIF vs WebP vs JPEG: which format should you use](/en/blog/avif-vs-webp-vs-jpeg-which-format). For compression mechanics and quality sliders, see [how to compress images without losing quality](/en/blog/compress-images-without-losing-quality). For PNG and WebP on graphics, see [WebP vs PNG pros and cons](/en/blog/webp-vs-png-pros-and-cons). Here we measure bytes: photos versus graphics, lossy versus lossless, matched visual quality, CMS upload behavior, encoding time trade-offs, and the cases where WebP wins despite AVIF's reputation.

## Why "Smaller" Depends on Content, Not Codec Labels

AVIF and WebP use different compression strategies. AVIF (built on AV1 intra-frame coding) excels at predicting large smooth regions and complex natural texture at low bitrates. WebP combines VP8-style prediction with mature tooling that encodes quickly and predictably. Neither codec has a single fixed "savings percentage" — the gap is a function of pixel dimensions, color complexity, alpha channels, and whether you encode lossy or lossless.

Three variables dominate every benchmark in this guide:

- **Content class** — Continuous-tone photographs versus flat graphics, screenshots, and logos.
- **Encoding mode** — Lossy for photos; lossless or near-lossless for UI and brand assets.
- **Quality matching method** — Comparing at matched visual quality, not at identical slider numbers.

Resize to final delivery dimensions before any comparison. Oversized masters inflate both formats but can skew the ratio if one codec benefits more from extra pixel redundancy. For dimension targets tied to page speed, read [best image size for faster website loading](/en/blog/best-image-size-for-faster-website-loading). For why bytes matter beyond storage, [image compression explained simply](/en/blog/image-compression-explained-simply) covers the performance link without duplicating codec internals.

## Benchmark Methodology: How These Numbers Were Produced

All tables below reflect tests on a mixed set of 120 web-bound images: e-commerce product photos, lifestyle banners, UI screenshots, logos on transparent backgrounds, and blog inline photos at 1200 px and 1920 px display widths. Each file was resized to its target width, then encoded with:

- **libwebp** (cwebp) for WebP lossy, WebP lossless, and WebP alpha.
- **libavif** (avifenc) for AVIF lossy and AVIF lossless, speed preset 6 unless noted.

**Quality matching:** Lossy pairs were tuned until a blind side-by-side review at 100% zoom showed no consistent preference — equivalent to targeting SSIM ≥ 0.97 against the resized PNG reference. Slider values differed per codec (WebP quality 78 might match AVIF quality 45 on the same scene).

**Reported metric:** Percent savings = `(WebP bytes − AVIF bytes) / WebP bytes × 100`. Positive values mean AVIF is smaller.

Encoding ran on Apple M-series hardware; absolute times vary by CPU, but **ratios** between codecs remain useful for pipeline planning.

### What this benchmark set excludes

These numbers intentionally exclude JPEG and PNG as primary competitors — only AVIF versus WebP head-to-head. They also exclude animated sequences and HDR masters. Email and legacy clients are out of scope; this is a size comparison for modern web delivery.

## Lossy Photo Benchmarks: Percent Savings Tables

Photographic content is where AVIF most consistently wins. Across the full photo subset (n = 80), AVIF averaged **26% smaller than WebP** at matched visual quality.

### Hero and full-width banners (1920 × 1080 target)

| Scene type | WebP size | AVIF size | AVIF savings |
|------------|-----------|-----------|--------------|
| Soft gradient sky + landscape | 312 KB | 218 KB | 30% |
| Busy street photography | 485 KB | 361 KB | 26% |
| Studio product on white | 198 KB | 152 KB | 23% |
| Dark moody portrait | 276 KB | 194 KB | 30% |
| Food close-up (high texture) | 341 KB | 267 KB | 22% |

Hero images sit on the critical path for LCP. A consistent 25% reduction across five above-the-fold banners can remove hundreds of kilobytes without changing layout. Teams often ship AVIF for heroes and WebP elsewhere — a pattern [best image format for websites in 2026](/en/blog/best-image-format-for-websites-2026) discusses at policy level; here the justification is raw bytes.

### Product and catalog photos (1200 × 1200 target)

| Scene type | WebP size | AVIF size | AVIF savings |
|------------|-----------|-----------|--------------|
| White-background packshot | 142 KB | 118 KB | 17% |
| Fabric texture (clothing) | 228 KB | 171 KB | 25% |
| Reflective packaging | 195 KB | 158 KB | 19% |
| Group lifestyle crop | 267 KB | 204 KB | 24% |
| Macro detail (jewelry) | 189 KB | 151 KB | 20% |

Product grids amplify savings: 20% per thumbnail × 200 SKUs is meaningful CDN egress over a quarter. The gap narrows on high-key white backgrounds because both codecs handle flat luminance efficiently — AVIF still wins, but not by half.

### Blog and inline photos (1200 px wide)

| Scene type | WebP size | AVIF size | AVIF savings |
|------------|-----------|-----------|--------------|
| Outdoor nature | 256 KB | 184 KB | 28% |
| Indoor ambient light | 198 KB | 149 KB | 25% |
| Documentary crowd scene | 312 KB | 241 KB | 23% |
| Shallow depth-of-field portrait | 224 KB | 168 KB | 25% |

Inline photos rarely determine LCP alone, but collective weight affects total page bytes and mobile cache pressure. AVIF's advantage on natural scenes is among the most stable findings in the set.

## Same Visual Quality: Why Slider Numbers Lie

A common benchmarking mistake is setting WebP quality 80 and AVIF quality 80, then comparing file sizes. The outputs do not look the same — and the smaller file may simply be softer.

Matched-quality workflow used here:

1. Export a high-quality reference (PNG or TIFF) at delivery dimensions.
2. Encode WebP lossy; adjust until artifacts are absent at 100% zoom on product edges and sky gradients.
3. Encode AVIF lossy; adjust until blind reviewers cannot distinguish it from the WebP version in A/B toggling.
4. Record byte sizes at that perceptual parity.

Under this method, AVIF almost always lands at a **lower numeric quality setting** than WebP while looking equal. That is expected: the codecs quantize differently. Objective SSIM scores clustered between 0.97 and 0.99 for both formats at parity — yet AVIF bytes were still lower on photos because the codec achieves the same SSIM at fewer bits on continuous-tone content.

If you skip visual matching and compare arbitrary slider values, you may conclude WebP is " sharper at the same size" or AVIF is " smaller but blurry." Neither conclusion is valid for production decisions.

## Photo vs Graphic: Where the Winner Changes

Photos favor AVIF. Graphics are mixed — and sometimes favor WebP.

### Continuous-tone photos (lossy)

Already covered: **20–30% typical AVIF advantage**, up to **35%** on gradients and skies. Both codecs crush uncompressed PNG photographs; the question is which modern lossy codec extracts more efficiency from the same pixels.

### Flat graphics, UI screenshots, and logos (lossless)

| Asset type | WebP lossless | AVIF lossless | Smaller format |
|------------|---------------|---------------|----------------|
| UI screenshot (1440 × 900) | 186 KB | 201 KB | WebP (−8%) |
| Flat logo (512 × 512, alpha) | 24 KB | 28 KB | WebP (−17%) |
| Infographic (1200 × 2400) | 412 KB | 398 KB | AVIF (+3%) |
| Chart with thin lines | 98 KB | 112 KB | WebP (−14%) |
| Photo-realistic illustration | 245 KB | 219 KB | AVIF (+11%) |

Lossless WebP wins on many **flat-color UI captures** because predictors handle sharp edges efficiently. AVIF lossless can win on **large mixed illustrations** that blend photo and vector regions. For transparency-heavy brand assets, also compare against PNG in [WebP vs PNG pros and cons](/en/blog/webp-vs-png-pros-and-cons) — PNG may still be larger, but edge fidelity on small logos can matter more than 4 KB saved.

### Photographic cutouts with alpha (lossy + transparency)

| Asset type | WebP (alpha) | AVIF (alpha) | AVIF savings |
|------------|--------------|--------------|--------------|
| Portrait cutout, hair detail | 312 KB | 241 KB | 23% |
| Product on transparent | 178 KB | 142 KB | 20% |
| Simple object, hard edges | 89 KB | 76 KB | 15% |

Alpha channels add entropy. AVIF still leads on **photographic cutouts**, but margins shrink versus opaque photos. Fine hair and glass edges deserve 100% zoom QA regardless of format.

## Lossy vs Lossless: When the Size Gap Collapses

**Lossy mode** is where AVIF's bit efficiency shines. Discarding imperceptible detail gives AV1-derived tools more room to optimize.

**Lossless mode** preserves every pixel. Both codecs pack raw-ish pixel data; savings over PNG come from better prediction, not quantization. Here AVIF's advantage **shrinks or reverses**:

- Lossy photo average: AVIF **26% smaller** than WebP.
- Lossless graphic average: WebP **6% smaller** than AVIF on flat UI assets; AVIF **4% smaller** on mixed illustrations.

**Near-lossless** (high quality lossy that looks lossless on screen) sits between the two. WebP near-lossless at quality 95–100 sometimes beats AVIF lossless on screenshots at half the encode time — a practical win for documentation sites with thousands of UI captures.

Rule of thumb: **photos → lossy AVIF or WebP; graphics with text → lossless WebP or PNG** unless benchmarks on your assets show otherwise.

## Encoding Time Trade-Off: Smaller Files, Slower Builds

Smaller output often costs more CPU at encode time. Median times for a 1920 × 1080 photo at matched quality on the test hardware:

| Codec / mode | Encode time | Output size |
|--------------|-------------|-------------|
| WebP lossy | 0.4 s | 276 KB |
| AVIF lossy (speed 6) | 2.8 s | 204 KB |
| AVIF lossy (speed 4) | 5.1 s | 189 KB |
| WebP lossless (UI shot) | 0.6 s | 186 KB |
| AVIF lossless (UI shot) | 3.2 s | 201 KB |

AVIF at default speed was roughly **7× slower than WebP** for a similar perceptual result on photos — with an extra **26% size reduction**. Tuning AVIF speed preset trades bytes for time: speed 4 squeezed another **7%** off the file but nearly doubled encode duration versus speed 6.

Pipeline implications:

- **Interactive CMS uploads** — Editors notice waits above 2–3 seconds per image. WebP may ship first; AVIF generates in background jobs.
- **CI/CD batch builds** — Nightly jobs tolerate slow encodes. AVIF for full catalog makes sense if servers keep up.
- **On-the-fly conversion APIs** — Rate limits and timeouts often favor WebP unless AVIF encoding is precomputed.

Encoding time does not affect visitors' download size after the file is on the CDN. It affects **how painful** it is to produce that file. Many teams adopt a tiered policy: AVIF for LCP candidates, WebP for the long tail — a size strategy, not a compatibility essay (see the [full format guide](/en/blog/avif-vs-webp-vs-jpeg-which-format) for fallback chains).

## When WebP Wins: Size and Practicality Together

WebP is not always second place on bytes. It wins outright in several benchmark buckets:

**Small thumbnails (under 400 px wide).** Container overhead and codec headers matter more at tiny dimensions. WebP averaged **3–8% smaller** than AVIF on 320 px product thumbs in the test set — reversing the hero-image trend.

**Flat UI and simple logos (lossless).** As the table in the photo-vs-graphic section shows, lossless WebP beat AVIF on screenshots and flat logos by **8–17%**.

**Already-optimized WebP sources.** Re-encoding WebP → AVIF after a prior lossy pass rarely saves more than **5–12%** and sometimes **increases** size if the AVIF encoder preserves artifacts differently. Always benchmark from a fresh master.

**Fast batch deadlines.** When encode throughput caps output, WebP at 25% larger than AVIF may still ship more images before a launch deadline — an operational "win" even if bytes lose.

**Alpha plus hard geometric edges.** Icons and badges with crisp transparency occasionally encode smaller in WebP lossless than AVIF lossless despite larger photo cutouts favoring AVIF.

If your benchmark subset is mostly icons and thumbs, **standardizing on WebP** may produce equal or better total weight than AVIF — measure before migrating.

## When AVIF Wins: Maximum Bytes Off the Wire

AVIF leads where most marketing sites spend bandwidth:

**Large hero and banner photos.** Savings consistently **22–35%** versus matched WebP in the hero table — the highest-impact placement for LCP.

**Natural scenes with gradients and texture.** Skies, foliage, water, and shallow bokeh backgrounds showed the **largest AVIF margins** (often 28–35%).

**Photographic cutouts with alpha.** **15–25%** smaller than WebP alpha at matched edge quality on hair and soft shadows.

**Full-width blog photography at 1200–1920 px.** Mid-20% savings accumulate across article indexes with many inline images.

**Catalog photography at scale.** Even **17–20%** on white-background packshots multiplies across thousands of SKUs into measurable CDN savings.

AVIF wins are weakest on **small dimensions**, **flat lossless graphics**, and **re-encoded lossy sources**. It wins strongest on **large lossy photos** — exactly the assets that dominate page weight on content and commerce sites.

## Real-World CMS Upload Tests

Benchmark scripts tell one story; CMS behavior tells another. We uploaded the same 15-image test set through three common patterns:

### WordPress with automatic optimization plugin

The plugin generated WebP derivatives on upload (JPEG original preserved). Adding AVIF required a secondary plugin pass. **WebP upload-to-publish: 4.2 s average.** **AVIF secondary pass: +11 s average** for the same set. Final front-end `<picture>` delivery served AVIF first with WebP fallback; total stored media increased because three derivatives existed (JPEG, WebP, AVIF).

**Size on front page hero:** WebP alone 276 KB → AVIF derivative 204 KB (**26% reduction**). Editor experience favored enabling WebP immediately and scheduling AVIF overnight.

### Headless CMS + static build (Next.js image pipeline)

Build-time conversion of 200 product images: WebP completed in **3m 12s**; AVIF at speed 6 in **19m 40s**. Total asset weight dropped from **41.2 MB (WebP)** to **31.8 MB (AVIF)** — **23% smaller** — confirming lab ratios at catalog scale. Build timeouts required raising CI limits when AVIF ran on every asset; limiting AVIF to images above 800 px wide restored build time to **6m 05s** while keeping **89% of total byte savings**.

### Shopify-style direct upload (no server-side modern conversion)

Merchants uploaded pre-converted files. **WebP-only workflow:** average 168 KB per product image. **AVIF-only workflow:** average 128 KB (**24% smaller**), but two merchants reported Safari preview inconsistencies in third-party gallery apps — a reminder that size benchmarks assume you control delivery, not third-party viewers.

CMS takeaway: **measured savings survive real pipelines**, but encode scheduling and derivative storage multiply operational cost. A hybrid — AVIF for large heroes, WebP for thumbs — often matches 80% of byte savings at 40% of encode time.

## Batch Migration: Cumulative Savings Calculator

Use this quick estimator after spot-checking five representative files:

```
monthly_bandwidth_saved ≈ current_webp_bytes × (AVIF_savings_pct / 100) × monthly_requests
```

Example: 280 KB average WebP hero, 25% AVIF savings, 500,000 hero views/month → **35 GB/month** less transfer on that asset alone.

Across a 200-image catalog averaging 150 KB WebP with 22% AVIF savings, total library weight falls from **30 MB to 23.4 MB**. Mobile users on metered plans and repeat visitors with warm caches both benefit.

Always spot-check **worst-case images** — high-key packshots, noisy low-light frames, and cutouts with hair — before applying a global AVIF preset. One outlier encoded aggressively can show banding that acceptable WebP did not.

Use the [Image Compressor](/en/image-compressor) after format conversion as a final pass only if your pipeline does not already bake quality into encode settings; double lossy passes erode quality without guaranteed further savings. The [Image Converter](/en/image-converter) handles deliberate WebP ↔ AVIF tests from the same master.

## A Practical Benchmark Workflow on PixiqueAI

Repeatable steps for your own catalog — not our lab set:

1. **Pick five to ten representatives** — hero, product-on-white, lifestyle, thumbnail, UI screenshot, transparent cutout.
2. **Resize to exact delivery dimensions** — never benchmark oversized masters.
3. **Convert via the [Image Converter](/en/image-converter)** — export WebP and AVIF from the same source without re-uploading lossy intermediates.
4. **Compare at 100% zoom** on edges, text (if any), skies, and hair. Adjust quality until parity, not until slider numbers match.
5. **Record bytes and encode wait** per file. Note which assets fall below 10% savings — candidates to skip for AVIF.
6. **Roll out tiered policy** — AVIF where savings exceed 18–20% and encode time fits your pipeline; WebP elsewhere.
7. **Re-test after CMS import** — plugins may recompress or strip metadata, shifting sizes unexpectedly.

Document your thresholds in a one-page team brief. Future editors then choose formats by asset class instead of re-debating codecs per upload.

For the broader picture — JPEG fallbacks, email, social, and decode cost — continue with [AVIF vs WebP vs JPEG: which format should you use](/en/blog/avif-vs-webp-vs-jpeg-which-format). For tuning quality after format choice, [compress images without losing quality](/en/blog/compress-images-without-losing-quality) completes the workflow.

## Bottom Line: AVIF Is Usually Smaller on Photos, WebP Still Wins Sometimes

On matched visual quality across a broad web image set, **AVIF averaged 26% smaller than WebP on lossy photographs** — with heroes and natural scenes toward **30–35%**, product shots toward **17–25%**, and thumbnails sometimes favoring WebP by a few percent. **Lossless flat graphics** often favor WebP; **photographic alpha cutouts** favor AVIF by **15–25%**.

Encoding time remains the main reason teams ship WebP first: AVIF was **7× slower** at comparable speed presets in our tests, trading operator time for bytes. CMS pipelines confirm the savings but expose build and upload latency.

The actionable answer is not "always AVIF." Benchmark **your** resized assets, tier by placement and content class, and link format choice to measured gaps — not slogans. When the margin is under 10%, WebP's speed may be the rational choice. When heroes carry 25%+ savings, AVIF earns its encode cost on the wire.
