---
slug: how-image-compression-improves-pagespeed
locale: ro
publishedAt: 2026-06-23
seoTitle: Cum îmbunătățește compresia imaginilor Google PageSpeed — Ghid Core Web Vitals
title: Cum îmbunătățește compresia imaginilor Google PageSpeed
metaDescription: Află cum compresia imaginilor îmbunătățește scorul PageSpeed Insights, LCP, CLS și INP. Rezolvă audituri comune, optimizează hero, imagini responsive, lazy loading și CDN.
ogTitle: Cum îmbunătățește compresia imaginilor Google PageSpeed
ogDescription: Ghid practic despre optimizarea imaginilor pentru PageSpeed — Core Web Vitals, economii înainte/după, formate next-gen, dimensiuni corecte, encodare eficientă și workflow PixiqueAI.
excerpt: PageSpeed semnalează greutatea imaginilor mai des decât orice alt tip de asset. Fișiere mai mici, la dimensiunea corectă, în formate moderne mută LCP în zona verde fără redesign.
ctaHeading: Micșorează imaginile pentru PageSpeed mai rapid
ctaBody: Încarcă JPG, PNG, WebP sau AVIF și reduce dimensiunea înainte de publicare. Vezi bytes înainte și după, apoi combină compresia cu redimensionare și conversie de format.
ctaButton: Deschide Compresor Imagini
ctaToolSlug: compresie-poze
faq: [{"question":"Compresia imaginilor îmbunătățește scorul PageSpeed?","answer":"Da, când imaginile reprezintă o parte semnificativă din greutatea paginii. Compresia reduce timpul de transfer, ceea ce îmbunătățește direct Largest Contentful Paint pe paginile bogate în imagini. PageSpeed recompensează și formatele next-gen și fișierele la dimensiunea corectă — compresia e o parte din strategia de imagini, nu un buton magic pentru scor singur."},{"question":"Ce timp LCP ar trebui să țintesc pentru imaginile hero?","answer":"Google consideră LCP bun la 2,5 secunde sau mai puțin, necesită îmbunătățire între 2,5 și 4,0 secunde, și slab peste 4,0 secunde. Imaginile hero și lead de produs determină adesea LCP. Reducerea unui hero de 1,2 MB la 180 KB pe o conexiune mobilă poate muta LCP din necesită îmbunătățire în bun fără a schimba layout-ul."},{"question":"Lazy loading ajută mereu PageSpeed?","answer":"Lazy loading ajută imaginile sub fold prin amânarea bytes care nu afectează paint-ul inițial. Poate dăuna LCP dacă e aplicat pe hero sau pe cea mai mare imagine de deasupra fold-ului. Nu lazy-load candidatul LCP; amână rândurile de galerie, imaginile inline din articol și asset-urile din footer."},{"question":"Ce format de imagine e cel mai bun pentru PageSpeed?","answer":"AVIF și WebP obțin de obicei cele mai bune scoruri la auditurile PageSpeed pentru conținut fotografic, pentru că encodă mai eficient decât JPEG la calitate vizuală egală. PNG rămâne potrivit pentru logo-uri și transparență. Servește formate moderne cu fallback JPEG sau PNG prin elemente picture sau negociere CDN."},{"question":"De ce spune PageSpeed properly size images?","answer":"Auditul apare când browserul descarcă mai mulți pixeli decât afișează imaginea — de exemplu, un fișier de 3000 px într-un slot de 600 px. Imaginile supradimensionate risipesc bandwidth și întârzie LCP chiar dacă compresia e bună. Redimensionează la dimensiunile de afișare sau breakpoint-urile srcset mai întâi, apoi comprimă."},{"question":"Pot rezolva problemele PageSpeed legate de imagini fără developer?","answer":"Adesea da, pentru echipele de conținut. Poți comprima, redimensiona și converti formate înainte de upload cu unelte în browser precum PixiqueAI, înlocui asset-uri umflate în CMS și rerula Lighthouse. Markup-ul srcset responsive și configurarea CDN pot necesita ajutor de developer, dar optimizarea la nivel de fișier e accesibilă editorilor."}]
relatedLinks: [{"href":"/ro/blog/compress-images-without-losing-quality","label":"Comprimă imagini fără pierdere de calitate"},{"href":"/ro/blog/avif-vs-webp-vs-jpeg-which-format","label":"AVIF vs WebP vs JPEG"},{"href":"/ro/blog/resize-images-for-any-device","label":"Redimensionează imagini pentru orice dispozitiv"},{"href":"/ro/compresie-poze","label":"Compresor de imagini"}]
---

Google PageSpeed Insights nu e impresionat de cât de frumoase sunt fotografiile tale. Îi interesează cât de repede ajung pixelii, se decodează și se desenează pe ecran. Pe majoritatea site-urilor de marketing, blogurilor și magazinelor online, imaginile reprezintă cea mai mare parte a bytes transferați — adesea 50–70% din greutatea totală a paginii. Asta face compresia imaginilor una dintre pârghiile cu cel mai mare impact pentru îmbunătățirea scorului PageSpeed, trecerea pragurilor Core Web Vitals și livrarea unei experiențe mai rapide pe rețele mobile.

Compresia singură nu e tot povestea. PageSpeed evaluează dacă imaginile au dimensiunea potrivită, sunt encodate eficient, servite în formate moderne și încărcate fără a bloca cel mai mare element vizibil. Acest ghid explică cum greutatea imaginilor afectează PageSpeed și Core Web Vitals, cum arată câștigurile tipice înainte și după, cum interpretezi auditurile comune legate de imagini și cum se potrivește compresia alături de imagini responsive, lazy loading, livrare CDN și strategia pentru hero. Pentru setări pas cu pas de calitate și compromisuri de format, vezi ghidul [cum comprimi imagini fără pierdere de calitate](/ro/blog/compress-images-without-losing-quality) — aici ne concentrăm pe de ce compresia mișcă metricile PageSpeed și unde se încadrează în stack-ul de performanță.

## De ce contează greutatea imaginilor pentru Google PageSpeed

PageSpeed Insights simulează cum experimentează un utilizator real pagina ta — în principal pe mobil, pe o conexiune limitată. Imaginile domină simularea pentru că sunt mari, numeroase și adesea încărcate devreme în document. Un articol cu mult text dar cu un hero necomprimat poate totuși eșua auditurile de performanță. O pagină de produs cu o duzină de fișiere de 2 MB în galerie va avea dificultăți indiferent cât de rapid răspunde serverul.

Unealta traduce măsurătorile tehnice în oportunități și diagnostice. Elementele legate de imagini apar repetat: serve images in next-gen formats, properly size images, efficiently encode images, defer offscreen images. Fiecare corespunde bytes irosiți sau unui comportament de încărcare suboptimal. Remedierea greutății imaginilor rezolvă mai multe audituri simultan — de aceea workflow-urile de compresie și redimensionare produc îmbunătățiri vizibile ale scorului mai rapid decât micro-optimizarea JavaScript.

Motoarele de căutare tratează semnalele de experiență a paginii ca parte din contextul de ranking. Core Web Vitals — derivate din date reale în Chrome UX Report acolo unde sunt disponibile — includ metrici puternic influențate de imagini. Nu ai nevoie de scor PageSpeed perfect 100 pentru a ranța, dar LCP slab cronic pe template-uri bogate în imagini afectează atât utilizatorii, cât și poziționarea competitivă.

## Core Web Vitals explicate: LCP, CLS și INP

Core Web Vitals sunt trei metrici centrate pe utilizator pe care Google le folosește pentru a rezuma încărcarea, stabilitatea vizuală și interactivitatea. Imaginile ating toate trei, deși compresia afectează cel mai direct încărcarea.

**Largest Contentful Paint (LCP)** măsoară când cel mai mare element vizibil de conținut termină randarea — adesea o imagine hero, poză de produs sau banner full-width. Timing-ul LCP include DNS, conexiune, download, decodare și paint. Fișierele grele prelungesc fazele de download și decodare. Pragurile Google: **bun** ≤ 2,5 s, **necesită îmbunătățire** 2,5–4,0 s, **slab** > 4,0 s.

**Cumulative Layout Shift (CLS)** măsoară mișcarea neașteptată a layout-ului în timpul încărcării. Imaginile cauzează CLS când lipsesc atributele width și height și browserul nu poate rezerva spațiu înainte să sosească fișierul. Compresia nu rezolvă CLS singură — dar imaginile optimizate se încarcă mai repede, reducând fereastra în care apar salturile de layout. Combină mereu compresia cu dimensiuni explicite în markup.

**Interaction to Next Paint (INP)** înlocuiește First Input Delay ca metrică de responsivitate. Imaginile mari care concurează pentru timp de decodare pe main thread pe telefoane modeste pot afecta indirect INP când browserul e ocupat. Fișierele mai mici se decodează mai repede, lăsând loc pentru input utilizator. INP e mai puțin dominat de imagini decât LCP, dar galeriile umflate contează tot pe dispozitive constrânse.

Înțelegerea metricii pe care template-ul tău o pică te ajută să prioritizezi. Un hero lent afectează LCP. Dimensiuni lipsă afectează CLS. O pagină cu cincizeci de thumbnail-uri necomprimate poate afecta atât LCP (dacă unul e deasupra fold-ului), cât și timpul total de transfer.

### Cum se mapează bytes-ii imaginilor pe fiecare metrică

| Metrică | Factor principal legat de imagini | Rolul compresiei |
|---------|-----------------------------------|------------------|
| LCP | Transfer + decodare hero sau lead | Ridicat — fișiere mai mici se desenează mai repede |
| CLS | Lipsă width/height pe tag-uri img | Indirect — încărcare mai rapidă reduce durata shift-ului |
| INP | Contention decodare main thread | Moderat — asset-uri mai ușoare eliberează thread-ul mai devreme |

Rulează audituri Lighthouse mobile după fiecare pas de optimizare. Compară identificarea elementului LCP în raport — confirmă că hero-ul tău e cu adevărat candidatul LCP înainte de a optimiza imagini secundare.

## Cum mișcă compresia imaginilor scorul PageSpeed

Scorul PageSpeed combină date de laborator (Lighthouse) și, când sunt disponibile, date din teren de la utilizatori reali. Compresia imaginilor îmbunătățește metricile de lab prin reducerea **Total Byte Weight**, **Largest Contentful Paint** și uneori **Speed Index** — cât de repede se populează conținutul vizibil.

Compresia reduce dimensiunea fișierului fără a schimba neapărat dimensiunile afișate. Un JPEG 2400×1600 la calitate 95 poate cântări 980 KB; aceleași dimensiuni la calitate 82 cu encodare WebP pot ajunge la 180 KB fără diferență vizibilă pe un laptop. Economia de 800 KB se traduce direct în timp de download mai scurt pe profilul 4G pe care îl folosește Lighthouse.

PageSpeed estimează și **economii potențiale** per audit. „Efficiently encode images" cuantifică bytes recuperabili prin compresie mai bună. „Serve images in next-gen formats" estimează economii de la WebP sau AVIF. Abordarea ambelor — comprimă după alegerea formatului potrivit — elimină mai multe oportunități din raport.

Scorurile nu sunt liniare. Trecerea de la 45 la 65 e adesea mai ușoară decât de la 85 la 95. Optimizarea imaginilor aduce cele mai abrupte câștiguri timpurii pe paginile bogate în media. Paginile doar cu text au creșteri mai mici pentru că imaginile n-au fost niciodată bottleneck-ul.

### Ce nu rezolvă compresia singură

Compresia nu înlocuiește dimensiunile corecte. O imagine perfect comprimată de 4000 px declanșează tot „properly size images" dacă slotul de afișare are 800 px. Nu înlocuiește distribuția geografică CDN. Nu repară CSS sau JavaScript render-blocking care întârzie descoperirea imaginilor. Tratează compresia ca pasul final după redimensionare și alegerea formatului — aceeași ordine descrisă în [ghidul nostru de calitate la compresie](/ro/blog/compress-images-without-losing-quality).

## Înainte și după: câștiguri reale de performanță

Exemplele concrete clarifică la ce răspunde PageSpeed. Cifrele variază după conexiune, dispozitiv și overhead CMS, dar tiparele se repetă.

**Hero homepage marketing.** Original: JPEG 3840×2160, 2,1 MB, calitate 98, fără redimensionare. LCP mobile: 4,8 s, scor performanță PageSpeed 52. După redimensionare la 1920×1080 (2× pentru slot de 960 px), WebP la calitate 84, comprimat: 156 KB. LCP mobile: 2,1 s, scor 78. Același design vizual; bytes reduși cu 93%.

**Lead produs e-commerce.** Original: fotografie PNG 2000×2000 (export din editor), 3,4 MB. Element LCP: imagine produs. După redimensionare la 1600×1600, convertire la WebP lossy (fără alpha, fundal alb), compresie: 142 KB. LCP îmbunătățit de la 3,9 s la 2,3 s. PNG era formatul greșit pentru o fotografie — alegerea formatului plus compresia au contat mai mult decât ajustările fine ale slider-ului.

**Articol blog cu imagini inline.** Cinci JPEG-uri inline cu medie 890 KB fiecare, toate 2500 px lățime într-o coloană de conținut de 720 px. După redimensionare în lot la 1440 px lățime (2× retina pentru 720 px) și compresie la calitate 80: medie 98 KB per imagine. Greutatea totală a paginii a scăzut de la 4,6 MB la 620 KB imagini plus HTML. Speed Index îmbunătățit vizibil; LCP neschimbat pentru că elementul LCP era text — ilustrează că nu fiecare pagină e legată de LCP din imagini.

Documentează propriul înainte/după în WebPageTest sau Lighthouse. Fă screenshot la panoul de oportunități, aplică schimbări, rerulează. Stakeholder-ii înțeleg „LCP −2,4 secunde" mai bine decât puncte abstracte de scor.

## Auditurile PageSpeed pentru imagini pe care le vei vedea

Lighthouse afișează diagnostice recurente legate de imagini. Trei apar pe aproape fiecare site neoptimizat.

### Serve images in next-gen formats

Acest audit listează imagini livrabile ca WebP sau AVIF cu economii estimate de bytes. JPEG și PNG rămân fallback-uri valide, dar codecurile moderne encodă conținut fotografic mai eficient. O intrare tipică: „Est savings of 450 KiB" pentru un hero JPEG care s-ar micșora ca AVIF.

Cale de remediere: generează derivate WebP și AVIF din același master redimensionat, servește prin `<picture>` sau negociere Accept CDN. Citește [AVIF vs WebP vs JPEG](/ro/blog/avif-vs-webp-vs-jpeg-which-format) pentru compromisuri codec și pattern-uri fallback. Folosește [Convertorul de format](/ro/convertor-jpg-png) când migrezi asset-uri existente înainte de re-upload.

### Properly size images

Acest audit apare când dimensiunile intrinseci ale imaginii depășesc dimensiunea afișată — browserul descarcă pixeli pe care nu îi arată niciodată. Cauze frecvente: upload de original de cameră în sloturi CMS, srcset lipsă, un singur URL desktop pentru toate breakpoint-urile.

Cale de remediere: redimensionează la dimensiunea maximă de afișare necesară per breakpoint, apoi comprimă. Ghidul nostru [redimensionează imagini pentru orice dispozitiv](/ro/blog/resize-images-for-any-device) acoperă multiplicatorii retina și lățimile srcset. [Redimensionarea pozelor](/ro/redimensionare-poze) aplică ținte exacte de pixeli înainte de compresie.

### Efficiently encode images

Acest audit indică faptul că re-encodarea lossless sau lossy ar micșora fișierele fără a schimba dimensiunile — metadata umflată, calitate JPEG excesivă, PNG folosit pentru poze sau setări de export neoptimizate.

Cale de remediere: re-exportă la calitate rezonabilă (de obicei 80–85 pentru poze web), elimină metadata inutilă, alege formatul potrivit. Aici contează [setările de compresie](/ro/blog/compress-images-without-losing-quality): auditul vrea mai puțini bytes la același grid de pixeli.

Audituri suplimentare includ **defer offscreen images** (lazy loading), **uses responsive images** (srcset/sizes) și **preload LCP image** (hint de prioritate pentru hero). Compresia le susține pe fiecare dar nu înlocuiește markup-ul și strategia de încărcare.

## Imagini hero și calea critică de randare

Hero-ul e de obicei elementul LCP pe landing page-uri, headere de categorie și URL-uri de campanie. Stă pe calea critică: descoperit în HTML, fetch-uit devreme, decodat, desenat mare. Fiecare kilobyte pe această cale întârzie LCP proporțional pe mobil.

Checklist optimizare hero:

- **Redimensionează la lățimea reală de afișare × factor retina** — nu rezoluția nativă a camerei.
- **Comprimă ultimul** după ce toate editările creative sunt finalizate.
- **Preferă WebP sau AVIF** cu fallback JPEG pentru hero-uri fotografice.
- **Preload imaginea LCP** când framework-ul suportă — `<link rel="preload" as="image" href="..." fetchpriority="high">`.
- **Nu lazy-load hero-ul** — `loading="lazy"` pe candidatul LCP întârzie metrica pe care ai nevoie cel mai mult s-o îmbunătățești.
- **Specifică width și height** pentru a stabiliza layout-ul și a proteja CLS.

Dacă hero-ul e imagine de fundal CSS, consideră promovarea la `<img>` cu fetch priority — imaginile de fundal sunt mai greu de prioritizat și preload de Lighthouse. Unele framework-uri expun `priority` pe componente image (Next.js `Image` etc.); folosește aceste flag-uri doar pentru asset-uri lead deasupra fold-ului.

Gândirea pe calea critică se extinde la plasarea în HTML. Hero-urile încărcate târziu prin injectare JavaScript ratează ferestrele timpurii de fetch. Markup static sau imagini server-rendered în documentul inițial performează mai bine pentru LCP decât galerii doar client-side.

## Imagini responsive și srcset

Un singur fișier comprimat la un singur URL rar e suficient pentru site-uri responsive. Un hero de 1920 px comprimat la 200 KB ajută desktop-ul, dar telefoanele descarcă tot 200 KB pentru un slot de 390 px dacă nu servești variante mai mici.

Imaginile responsive folosesc `srcset` și `sizes` ca browserul să aleagă fișierul potrivit:

```html
<img
  src="hero-800.webp"
  srcset="hero-400.webp 400w, hero-800.webp 800w, hero-1200.webp 1200w"
  sizes="(max-width: 768px) 100vw, 960px"
  width="960"
  height="540"
  alt="Banner colecție produse"
  fetchpriority="high"
/>
```

Generează fiecare variantă de lățime din același master: redimensionează, apoi comprimă fiecare output. Nu comprima o singură dată la 2400 px și lăsa browserul să downscale — PageSpeed penalizează tot download-urile supradimensionate. Breakpoint-urile ar trebui să corespundă layout-ului CSS, nu numerelor rotunde arbitrare.

Art direction — crop-uri diferite per breakpoint — folosește `<picture>` cu surse separate. Compresia se aplică independent fiecărui crop. Pentru stack-uri de formate în livrare responsive, vezi [cel mai bun format de imagine pentru site-uri în 2026](/ro/blog/best-image-format-for-websites-2026) pentru template-uri de politică per clasă de asset.

Platformele CMS și framework-urile automatizează adesea generarea srcset. Dacă al tău nu o face, redimensionează în lot cu [Redimensionare poze](/ro/redimensionare-poze) la 400, 800 și 1200 px lățime, comprimă fiecare, uploadează cu naming consistent.

### PageSpeed mobil și srcset împreună

PageSpeed folosește implicit testarea mobile în lab pentru că majoritatea traficului e mobil și constrângerile sunt mai stricte. O imagine de 1 MB pe fibră pare instant; pe 4G limitat sunt câteva secunde de download înainte de decodare. Proiectează pentru viewport-uri înguste cu candidați srcset mai mici, plafonează retina la 2× decât dacă zoom pinch pe detaliu produs justifică 3×, și auditează pe dispozitive reale când e posibil. Scorurile PageSpeed mobile sar adesea mai dramatic decât desktop după optimizarea imaginilor — raportează ambele, dar prioritizează LCP mobile când alegi calitatea hero.

## Lazy loading: ce ajută și ce dăunează LCP

Lazy loading amână imaginile până se apropie de viewport. `loading="lazy"` nativ pe tag-uri `<img>` e larg suportat și rezolvă auditul **defer offscreen images** pentru conținut sub fold.

Reguli pentru lazy loading sigur PageSpeed:

- **Nu lazy-load imaginea LCP** sau orice poză lead deasupra fold-ului.
- **Lazy-load rânduri galerie, imagini corp articol sub fold, avatare comentarii, badge-uri footer.**
- **Testează după activarea lazy load la nivel de CMS** — unele teme lazy-load hero-ul implicit, distrugând LCP.
- **Combină cu dimensiuni placeholder** ca imaginile amânate să nu cauzeze CLS când sosesc.

Lazy loading nu reduce bytes total transferați — schimbă timing-ul. Ajută paint-ul inițial și LCP când e aplicat corect. Nu ajută dacă fiecare imagine e deasupra fold-ului pe mobil (frecvent pe landing page-uri scurte). În acele layout-uri, compresia și redimensionarea contează mai mult decât amânarea.

Interacțiunea cu compresia: imaginile amânate beneficiază tot de fișiere mai mici când utilizatorul derulează. O poză inline de 600 KB tot doare când intră în view pe o conexiune lentă — comprimă și redimensionează chiar dacă e lazy-loaded.

## CDN, caching și compresie împreună

Un CDN cache-uiește imaginile la edge-uri mai aproape de utilizatori. Compresia reduce stocarea și costurile de transfer la origin; CDN-urile reduc latenta. Împreună îmbunătățesc performanța la vizite repetate și acoperirea geografică.

Considerente CDN pentru imagini:

- **Cache-uiește filename-uri immutable** — `hero-v3-1200.webp` cu `Cache-Control` max-age lung. Versionează în filename când conținutul se schimbă.
- **Activează Brotli sau gzip pentru SVG și JSON** — imaginile în sine sunt formate deja comprimate; dublu-gzip pe binar JPEG e ineficient.
- **Negociere de conținut** — unele CDN-uri servesc AVIF sau WebP pe baza header-elor `Accept` de la un singur pattern URL.
- **Tier-uri optimizare imagini** — CDN-urile managed pot oferi resize și conversie format on-the-fly. Util, dar pre-optimizarea înainte de upload dă calitate predictibilă și evită vendor lock-in.

Compresia la build sau upload bate dependența doar de re-encodare la edge. Controlezi calitatea vizual înainte de publicare. Optimizarea la edge e plasă de siguranță pentru asset-uri legacy, nu substitut pentru un workflow CMS disciplinat.

Combină livrarea CDN cu headere cache corecte pentru HTML — HTML stale care referă filename-uri noi de imagini strică layout-ul. Coordonează deploy-urile când redenumești asset-uri optimizate.

## Greșeli frecvente PageSpeed legate de imagini

**Optimizarea thumbnail-urilor dar nu a hero-ului.** Elementul LCP conduce metrica pe care utilizatorii o simt cel mai mult.

**Lazy-load pe tot, inclusiv imaginea lead.** Toggle CMS ușor, LCP catastrofal.

**Conversie la WebP fără redimensionare.** Economiile de format ajută; supradimensionarea tot pică audituri.

**Compresie înainte de redimensionare.** Encodă pixeli pe care îi arunci ulterior — vezi [comprimă fără pierdere de calitate](/ro/blog/compress-images-without-losing-quality) pentru ordinea corectă.

**Urmărirea scorului fără date din teren.** Scorurile lab ghidează munca; LCP CrUX din teren confirmă impactul pe utilizatori reali.

**Un singur preset global de calitate.** Hero-urile au nevoie de calitate mai mare decât thumbnail-urile de 200 px; ambele pot fi comprimate, dar nu identic.

**Ignorarea fotografiilor PNG.** Exporturile după eliminare fundal distrug PageSpeed; convertește sau comprimă agresiv după editare.

**Înlocuire imagini fără actualizarea dimensiunilor în markup.** Rapoarte de aspect noi plus atribute width/height vechi cauzează CLS.

## Workflow PixiqueAI orientat PageSpeed

Pipeline repetabil de la asset brut la publicare prietenoasă PageSpeed:

1. **Auditează pagina live** — Rulează Lighthouse mobile; notează elementul LCP, oportunitățile imagini și greutatea totală bytes.
2. **Redimensionează la ținte de afișare** — Folosește [Redimensionare poze](/ro/redimensionare-poze) și breakpoint-urile din [redimensionează pentru orice dispozitiv](/ro/blog/resize-images-for-any-device). Generează lățimi srcset dacă CMS-ul le suportă.
3. **Alege formatul** — WebP sau AVIF pentru poze; PNG sau WebP alpha pentru transparență. Consultă [AVIF vs WebP vs JPEG](/ro/blog/avif-vs-webp-vs-jpeg-which-format) și [cel mai bun format pentru site-uri 2026](/ro/blog/best-image-format-for-websites-2026).
4. **Comprimă ca pas final** — [Compresor de imagini](/ro/compresie-poze) cu setări adaptate formatului. Ghidul detaliat de calitate e în [comprimă fără pierdere de calitate](/ro/blog/compress-images-without-losing-quality).
5. **Convertește loturi legacy** — [Convertor JPG PNG](/ro/convertor-jpg-png) pentru migrarea bibliotecilor JPEG și PNG la codecuri moderne înainte de re-upload.
6. **Actualizează markup-ul** — width, height, fetchpriority pe hero, lazy load sub fold, srcset/sizes unde e cazul.
7. **Retestează** — Lighthouse și, când e disponibil, date din teren PageSpeed Insights. Compară LCP și panoul de oportunități.

Compresia e pasul patru, nu primul — dar e pasul care transformă fișiere moderne la dimensiunea corectă în câștiguri PageSpeed. Un hero la dimensiunile potrivite dar exportat tot la calitate 98 poate pică **efficiently encode images** până nu comprimi.

## Concluzie: pagini mai rapide, același creative

PageSpeed recompensează paginile care respectă bandwidth-ul și ordinea de randare. Imaginile sunt obstacolul obișnuit pentru că sunt mari, vizibile și emoțional critice — echipele ezită să le atingă. Nu ai nevoie de pierdere vizibilă de calitate pentru reduceri mari de bytes; ai nevoie de dimensiuni corecte, formate moderne, encodare rezonabilă și disciplină de încărcare pe calea critică.

Performanța și SEO se intersectează pe imagini fără a fi identice. Nume de fișiere descriptive, alt text și date structurate ajută descoperirea, iar URL-uri comprimate și la dimensiunea corectă țin crawler-ii și utilizatorii pe răspunsuri rapide. Ghidul nostru despre [cum optimizezi imaginile pentru SEO](/ro/blog/how-to-optimize-images-for-seo) acoperă filename-uri, pattern-uri alt și tag-uri imagini în sitemap — combină-l cu workflow-ul de mai sus și publică o dată cu ambele casete bifate. Servește aceleași asset-uri optimizate Googlebot-ului și vizitatorilor; fără cloaking pe URL-uri imagini.

Măsoară înainte și după pe URL-urile care contează: homepage, categorie top, produs best-seller, cel mai lung articol. Urmărește elementul LCP și bytes total imagini, nu doar scorul din titlu. Când imaginile sunt optimizate, munca pe JavaScript și fonturi devine următoarea frontieră — dar pe majoritatea site-urilor de conținut și commerce, imaginile sunt tot de unde începe îmbunătățirea PageSpeed.

Comprimă cu intenție, redimensionează înainte de encodare, servește fișierul potrivit fiecărui dispozitiv și ține hero-ul pe calea rapidă. Raportul tău PageSpeed — și utilizatorii din spatele lui — vor observa diferența înainte să o observe designerii.
