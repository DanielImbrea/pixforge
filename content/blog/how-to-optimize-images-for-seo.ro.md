---
slug: how-to-optimize-images-for-seo
locale: ro
publishedAt: 2026-06-23
seoTitle: Cum optimizezi imaginile pentru SEO — Ghid complet
title: Cum optimizezi imaginile pentru SEO
metaDescription: Află cele mai bune practici SEO pentru imagini: nume descriptive de fișiere, text alternativ, atribute title, sitemap-uri de imagini, schema ImageObject, carduri Open Graph, lazy loading, URL-uri CDN, accesibilitate, trafic Google Images și poze de produs.
ogTitle: Cum optimizezi imaginile pentru SEO
ogDescription: Ghid practic despre SEO pentru imagini — denumire, alt text, date structurate, previzualizări social, Core Web Vitals, trafic Google Images, galerii de produs și un workflow PixiqueAI care leagă viteza de vizibilitate.
excerpt: Motoarele de căutare citesc mai mult decât paragrafele tale. Numele fișierelor, textul alternativ, datele structurate și viteza de încărcare influențează dacă imaginile tale apar în Google Images, rich results și previzualizări social — sau rămân ascunse după upload-uri generice.
ctaHeading: Optimizează dimensiunea fără să pierzi calitate
ctaBody: Imaginile mai mici se încarcă mai repede — iar viteza paginii e un semnal de ranking. Comprimă JPG, PNG, WebP sau AVIF după redimensionare și redenumire, apoi publică cu încredere.
ctaButton: Deschide Compresor Imagini
ctaToolSlug: compresie-poze
faq: [{"question":"Numele fișierelor de imagine afectează SEO-ul?","answer":"Da. Nume descriptive cu cratime, precum adidasi-alergare-albastri-profil.webp, oferă crawlerilor context lizibil înainte să parseze alt text-ul sau conținutul paginii. Nume generice precum IMG_4521.jpg nu transmit niciun semnal de cuvinte cheie și îngreunează gestionarea asset-urilor în CMS și CDN."},{"question":"Cât de lung ar trebui să fie textul alternativ pentru SEO?","answer":"Țintește o propoziție concisă care descrie scopul imaginii și detaliile vizibile importante — de obicei sub 125 de caractere când e posibil, dar claritatea bate un număr rigid. Include cuvinte cheie relevante doar când descriu natural ce e în imagine. Nu umple cu keywords și nu repeta același alt pe fiecare thumbnail dintr-o galerie."},{"question":"Lazy loading-ul dăunează SEO-ului imaginilor?","answer":"Lazy loading pentru imaginile sub fold e recomandat și nu împiedică indexarea când imaginile rămân în HTML cu src sau srcset valide. Evită lazy loading pe hero-ul LCP sau poza principală de produs deasupra fold-ului; amânarea lor poate încetini Largest Contentful Paint și afecta indirect ranking-ul."},{"question":"Ar trebui să folosesc un sitemap de imagini?","answer":"Un sitemap de imagini ajută Google să descopere imagini încărcate via JavaScript, din galerii fără linkuri interne puternice sau din cataloage e-commerce mari. Completează — nu înlocuiește — markup-ul bun on-page, alt text descriptiv și tag-uri img crawlable cu URL-uri stabile."},{"question":"Care e diferența între alt text și atributul title?","answer":"Alt text-ul descrie imaginea pentru screen reader-e și motoare de căutare când imaginea nu se poate afișa; e esențial pentru accesibilitate și SEO. Atributul title apare ca tooltip la hover în unele browsere și e opțional — nu înlocuiește alt-ul și nu ar trebui să-l duplice verbatim."},{"question":"Cum optimizez imaginile de produs pentru Google Shopping și căutare imagini?","answer":"Folosește dimensiuni consistente, nume de fișiere și alt text descriptive per SKU, fundal curat unde e cazul, formate moderne comprimate și rezoluție suficientă pentru zoom. Leagă schema Product cu URL-uri ImageObject care coincid cu imaginile de pe pagină. Evită să încarci aceeași poză de la producător pe sute de listări fără conținut textual unic."}]
relatedLinks: [{"href":"/ro/blog/how-image-compression-improves-pagespeed","label":"Cum îmbunătățește compresia PageSpeed-ul"},{"href":"/ro/blog/compress-images-without-losing-quality","label":"Comprimă imagini fără pierdere de calitate"},{"href":"/ro/blog/resize-images-for-any-device","label":"Redimensionează imagini pentru orice dispozitiv"},{"href":"/ro/compresie-poze","label":"Compresor de imagini"}]
---

Imaginile nu sunt decor lipit de text — sunt asset-uri indexabile. Google Images, Bing Visual Search, rich results și previzualizările social extrag din aceleași fișiere din biblioteca ta media. O poză de produs numită `IMG_9842.jpg`, fără alt text și de 3 MB, nu spune crawlerilor aproape nimic și se încarcă greu pe mobil. Un WebP comprimat numit `portofel-piele-barbati-maro-deschis.webp`, cu alt text corect, URL CDN stabil și date structurate potrivite poate aduce trafic calificat din căutarea de imagini direct pe pagina de produs.

SEO pentru imagini stă la intersecția vizibilității, accesibilității și performanței. Numele fișierelor și alt text-ul ajută motoarele să înțeleagă conținutul. Sitemap-urile de imagini și schema ImageObject îmbunătățesc descoperirea și eligibilitatea pentru rich results. Imaginile Open Graph și Twitter controlează cum apar linkurile la share. Compresia și dimensionarea responsive influențează Core Web Vitals — iar viteza paginii rămâne un factor de ranking, cum explicăm în ghidul despre [cum îmbunătățește compresia imaginilor PageSpeed-ul](/ro/blog/how-image-compression-improves-pagespeed).

Acest ghid parcurge fiecare strat: denumire, atribute alt și title, formate și dimensiuni, sitemap-uri, date structurate, meta tag-uri social, compromisuri lazy loading, livrare CDN, trafic Google Images, galerii e-commerce și cum eviți conținut duplicat subțire când aceeași poză stock apare peste tot. Fie că publici tutoriale pe blog sau gestionezi un magazin cu mii de SKU-uri, aceste practici transformă upload-urile în asset-uri căutabile, partajabile și accesibile.

## De ce contează SEO-ul imaginilor pentru trafic organic

Căutarea vizuală s-a maturizat. Cumpărătorii caută produse prin reverse image search. Cititorii de blog ajung din Google Images pe un singur diagram. Publisherii câștigă featured snippets cu thumbnail-uri. Dacă imaginile tale sunt fără nume, fără etichetă sau umflate, lași acel trafic concurenților care le-au optimizat.

SEO pentru imagini susține și povestea ranking-ului paginii principale. Alt text accesibil întărește relevanța tematică. Hero-urile rapide îmbunătățesc Largest Contentful Paint. Datele structurate leagă produsele de poze în rezultate. Imaginile de previzualizare social cresc click-through-ul când paginile sunt partajate pe LinkedIn, Slack sau X.

Munca se acumulează: o imagine bine numită, comprimată și etichetată, refolosită în articole, email și social, rămâne consistentă. Un folder media haotic forțează upload-uri duplicate, linkuri rupte după migrări CDN și URL-uri schema care nu se potrivesc și confundă crawlerii.

Tratează fiecare imagine ca o oportunitate de landing — nu doar pagina pe care stă, ci și căutarea de imagini, rich results și feed-urile social care expun fișierul în sine.

## Nume descriptive de fișiere pe care motoarele le înțeleg

Înainte ca un crawler să citească alt text-ul sau paragrafele din jur, vede calea URL și numele fișierului. `adidasi-trail-albastri-2026.webp` comunică subiect, context și format. `DSC00451.jpg` nu comunică nimic.

Bune practici pentru nume de fișiere prietenoase SEO:

- **Litere mici și cratime** — `cana-ceramica-rosie`, nu `Cana_Ceramica_Rosie` sau spații codificate `%20`.
- **Descrie subiectul primul** — tip produs, culoare, unghi sau scenă înainte de coduri brand sau campanie.
- **Păstrează nume lizibile** — 3–6 cuvinte ajung adesea; evită keyword stuffing precum `cei-mai-ieftini-adidasi-adidasi-alergare.jpg`.
- **Potrivește extensia cu formatul final** — `.webp` sau `.avif` din nume trebuie să reflecte fișierul servit după conversie.
- **Rămâi stabil după publicare** — schimbarea numelor rupe linkuri inbound și referințe schema; redenumește înainte de upload.

### Denumire e-commerce și catalog

Pentru SEO de produs, aliniază numele fișierelor cu SKU sau slug-uri pe care echipa le poate automatiza: `sku-8842-curea-piele-negru-fata.webp`. Include atribute variantă — culoare, vedere mărime, cantitate pachet — ca depozit, CMS și denumire SEO să rămână sincronizate. Marketplace-urile pot redenumi la import; un nume descriptiv de la început le oferă input mai bun.

Când furnizorii livrează `photo1.jpg`, redenumește înainte de primul upload în CMS. Redenumiri retroactive pe CDN necesită redirecturi și purge cache — costisitor pe cataloage mari.

### Nume de fișiere de evitat

Evită default-urile camerei (`IMG_`, `DSC_`), ID-uri stock generice (`shutterstock_1234567.jpg`) și căi CDN doar cu hash fără structură de foldere. Dacă CDN-ul ofuschează căile, compensează cu alt text puternic, sitemap-uri de imagini și schema — dar căile lizibile ajută totuși analytics-ul și debugging-ul uman.

Nume duplicate pe locale (`product.jpg` în fiecare folder de limbă) confundă raportarea; preferă sufixe locale doar când conținutul imaginii diferă: `manual-produs-ro.webp` vs `manual-produs-en.webp`.

## Bune practici pentru alt text: SEO și accesibilitate

Alt text-ul e descrierea textuală principală a unei imagini pentru screen reader-e și motoare de căutare. Ar trebui să răspundă: dacă imaginea nu s-ar încărca, ce informație esențială ar pierde utilizatorul?

Ghid pentru alt text solid:

- **Fii specific** — „Stivă de trei tricouri navy pliate pe raft alb” bate „tricouri”.
- **Include contextul paginii** — o poză pe un articol de rețetă poate menționa numele preparatului; aceeași poză într-un review de ustensile menționează modelul tăvii.
- **Pune subiectul la început** — cuvintele importante ajută scanerii și tehnologia assistivă.
- **Sari peste fraze redundante** — evită „imagine cu” sau „poză cu”; crawlerii știu deja că e imagine.
- **Nu face keyword stuffing** — o mențiune naturală a expresiei țintă e suficientă când e corectă.

### Imagini decorative și alt gol

Grafica pur decorativă — texturi de fundal, icoane spațiere, separatoare ornamentale — ar trebui să folosească `alt=""` ca screen reader-ele să le sară. Nu omite atributul alt complet; alt gol e intenționat pentru decor. Iconițele funcționale (căutare, coș, descărcare) au nevoie de alt descriptiv sau text accesibil în apropiere.

### Modele de alt text pentru blog și produse

**Imagini how-to pe blog:** descrie pasul arătat — „Captură ecran dialog export cu calitate WebP setată la 85.”

**Hero produs:** nume produs, culoare, vedere — „Căști wireless Aria, negru mat, profil lateral.”

**Thumbnail-uri galerie:** fiecare unghi primește alt unic — față, spate, detaliu, scară — nu aceeași propoziție de șase ori.

**Grafice și infografice:** rezumă concluzia în alt și oferă caption mai lung sau tabel de date în corpul paginii pentru accesibilitate completă.

Alt text-ul și caption-urile vizibile se completează; nu ar trebui să fie identice cuvânt cu cuvânt dacă caption-ul adaugă narațiune pe care alt-ul nu o poate purta.

## Atributul title: context opțional, nu scurtătură la ranking

Atributul HTML `title` pe elementele `<img>` arată un tooltip la hover pe unele browsere desktop. Nu substituie alt text-ul și nu e anunțat consistent de screen reader-e.

Folosește title cu moderație:

- **Detaliu suplimentar** — copyright sau credit fotograf când politica o cere și alt-ul e deja descriptiv.
- **Când alt trebuie să rămână scurt** — cazuri rare unde title adaugă context necritc.

Evită duplicarea alt-ului verbatim în title — creează zgomot pentru utilizatorii de tehnologie assistivă care întâlnesc ambele. Nu te aștepta ca atributele title să boosteze ranking-ul pe keywords; Google le tratează de mult timp ca semnale minore cel mult.

Pentru SEO și accesibilitate, investește în alt text, heading-uri din apropiere și caption-uri figure.

## Format, dimensiuni și viteză ca semnale SEO

Motoarele de căutare recompensează paginile care se încarcă rapid și se renderează fiabil. Imaginile domină adesea greutatea paginii; fișiere supradimensionate încetinesc Largest Contentful Paint și cresc rata de respingere pe rețele mobile. Viteza nu e separată de SEO-ul imaginilor — determină dacă utilizatorii și crawlerii rămân suficient pentru a indexa conținutul vizual.

Articolele dedicate acoperă adâncime pe care ar trebui să o legi, nu să o duplici aici:

- [Cel mai bun format de imagine pentru site-uri în 2026](/ro/blog/best-image-format-for-websites-2026) — când alegi JPEG, WebP, AVIF sau PNG.
- [Comprimă imagini fără pierdere de calitate](/ro/blog/compress-images-without-losing-quality) — setări de calitate și ordinea workflow-ului.
- [Cum îmbunătățește compresia imaginilor PageSpeed-ul](/ro/blog/how-image-compression-improves-pagespeed) — legătura între bytes economisiți și Core Web Vitals.
- [Redimensionează imagini pentru orice dispozitiv](/ro/blog/resize-images-for-any-device) — potrivirea dimensiunilor pixel cu sloturile de afișare și multiplicatorii retina.

### Formate moderne și fallback-uri

Servește WebP sau AVIF cu fallback JPEG sau PNG când stack-ul o cere. Fișiere mai mici ajung la starea interactivă mai repede fără să schimbe layout-ul. Specifică lățime și înălțime în markup pentru a preveni Cumulative Layout Shift când imaginile optimizate se încarcă.

### Redimensionează și comprimă înainte de publicare

Ordinea corectă: editează, decupează, redimensionează la dimensiunile țintă, convertește format dacă e nevoie, comprimă ultimul. Folosește [Redimensionare Poze](/ro/redimensionare-poze) pentru dimensiuni și [Compresorul de imagini](/ro/compresie-poze) ca pas final de export. Publicarea unui fișier de cameră de 4000 px într-o coloană de blog de 600 px irosește bandă și diluează semnalele de performanță.

## Sitemap-uri de imagini: ajută crawlerii să găsească asset-urile vizuale

Un sitemap XML de imagini listează URL-uri de imagini asociate paginilor site-ului. Ajută descoperirea când:

- Imaginile se încarcă via galerii JavaScript pe care crawlerii nu le execută complet.
- Poze critice stau pe pagini cu puține linkuri interne.
- Rulezi un catalog e-commerce mare unde SKU-uri noi depășesc linkarea manuală.

Fiecare intrare include de obicei `<loc>` pentru pagină, plus tag-uri copil `<image:image>` cu `<image:loc>` (URL direct imagine), opțional `<image:caption>` și `<image:title>`. Păstrează title-urile și caption-urile aliniate cu alt text-ul on-page — inconsistența trimite semnale mixte.

Sitemap-urile de imagini completează sitemap-urile standard; nu înlocuiesc tag-uri `<img>` crawlable în HTML. Căi blocate în robots.txt sau pagini noindex nu beneficiază doar de includere în sitemap.

Actualizează sitemap-urile când adaugi linii de produs, publici ghiduri cu multe poze sau migrezi domenii CDN. Trimite prin Google Search Console și monitorizează rapoartele de acoperire pentru URL-uri de imagini excluse.

## Date structurate cu ImageObject și rich results

Markup Schema.org ajută motoarele să lege paginile de URL-uri specifice de imagini pentru produse, articole, rețete și altele. `ImageObject` descrie o resursă imagine — URL, caption, lățime, înălțime și format de encodare.

Modele frecvente:

- **Schema Product** — proprietatea `image` ca URL sau array de URL-uri potrivite ordinii galeriei de pe pagină.
- **Schema Article** — `image` pentru thumbnail-uri headline eligibile pentru Top Stories sau rich results de articol unde e suportat.
- **WebPage / primaryImageOfPage** — clarifică hero-ul principal pentru URL.

Reguli care previn erori rich result:

- URL-urile din schema trebuie să coincidă cu ce văd utilizatorii — nu un fișier ascuns la rezoluție mai mare sau un crop diferit.
- Folosește URL-uri HTTPS absolute stabile pe CDN.
- Include dimensiuni recomandate unde validatorii le așteaptă; logo-uri și imagini produs prea mici pot eșua eligibilitatea.

Validează cu Rich Results Test de la Google după schimbări de template. Un câmp merge stricat care propagă URL-uri `null` pe zece mii de pagini de produs declanșează pierdere masivă de rich results.

## Imagini Open Graph și Twitter Card pentru partajare social

Platformele social nu folosesc numele fișierului SEO on-page la generarea previzualizărilor — citesc meta tag-urile Open Graph și Twitter. Un `og:image` lipsă sau la rezoluție mică face ca share-urile să cadă pe imagini random de pe pagină sau linkuri doar text.

Esential Open Graph:

- **`og:image`** — URL absolut către imagine de previzualizare, de obicei 1200×630 px pentru linkuri generale (1.91:1).
- **`og:image:width` și `og:image:height`** — ajută platformele să aloce layout înainte de încărcare.
- **`og:image:alt`** — descrie previzualizarea pentru accesibilitate în unele clienți.

`twitter:card` setat la `summary_large_image` cu `twitter:image` aliniat la același asset reduce munca duplicată.

Imaginile de previzualizare social pot diferi de hero-urile din articol — un template de brand cu titlu e frecvent — dar păstrează nume și alt descriptive în biblioteca media pentru căutare internă. Comprimă și imaginile OG; Slack și LinkedIn le preiau la fiecare share.

Când testezi A/B creative de previzualizare, versionează numele fișierelor (`og-lansare-produs-v2.webp`) ca cache-ul CDN să nu servească thumbnail-uri vechi.

## Lazy loading, LCP și ce vede de fapt Google

Lazy loading amână imaginile offscreen până când utilizatorul derulează aproape, economisind bandă pe pagini lungi. `loading="lazy"` nativ pe `<img>` e larg suportat și sigur SEO pentru conținut sub fold, pentru că `src` sau `srcset` complet rămâne în HTML — crawlerii pot totuși prelua URL-ul.

Excepții critice:

- **Nu lazy load imagini LCP** — cel mai mare element vizual deasupra fold-ului, adesea hero sau poza principală de produs. Amânarea întârzie Largest Contentful Paint și dăunează Core Web Vitals. Marchează hero-urile cu `loading="eager"` sau omit atributul (default eager).
- **Carusele** — primul slide vizibil la load nu ar trebui lazy; slide-urile următoare pot fi.
- **Imaginea principală produs** — încarcă imediat; thumbnail-urile din bandă pot lazy load.

Lazy loader-e JavaScript care înlocuiesc placeholder-e cu data attributes sunt ok când noscript sau HTML inițial expune tot URL-uri pentru crawleri — verifică cu Inspect URL din Search Console și vizualizări HTML randate.

Echilibru: lazy load pe galerii în articole și grile de categorii; păstrează eager imaginea care definește first paint. Citește [cum îmbunătățește compresia PageSpeed-ul](/ro/blog/how-image-compression-improves-pagespeed) pentru checklist-ul LCP complet alături de deciziile de lazy loading.

## Livrare CDN, URL-uri stabile și accesibilitate imagini

Rețelele de livrare conținut îmbunătățesc timpii de încărcare globali — un câștig de performanță pentru SEO. Introduc și modele de URL care afectează cache, canonicalizare și accesibilitate.

Bune practici CDN:

- **URL-uri stabile după publicare** — schimbarea căilor rupe backlink-uri, schema și sitemap-uri. Versionează cu nume noi când asset-urile se actualizează (`produs-primavara-2026.webp`), nu suprascrieri silențioase.
- **Headere cache lungi pentru asset-uri imutabile** — nume cu hash permit `Cache-Control: max-age=31536000, immutable`.
- **HTTPS peste tot** — conținut mixt blochează imagini și erodează semnale de încredere.
- **srcset responsive** — servește lățimi potrivite per viewport; mobilul nu ar trebui să descarce fișiere hero desktop.

Accesibilitatea se suprapune cu munca CDN: alt text-ul trebuie să descrie imaginea indiferent de serverul edge care a livrat-o. Nu te baza pe auto-captioning AI al CDN-ului ca substitut pentru alt scris de om pe conținut semnificativ.

Pentru site-uri internaționale, `hreflang` pe pagini contează mai mult decât locale în URL-urile imaginilor — dar folosește alt text localizat când imaginea include text overlay specific unei limbi.

## Trafic Google Images și SEO pentru produse e-commerce

Google Images trimite vizite cu intenție mare — cineva caută atribute vizuale ale unui produs, un pas how-to sau un grafic comparativ. Captează traficul cu nume descriptive, alt unic per unghi și pagini care înconjoară imaginile cu copy substanțial.

Checklist SEO imagini produs:

- **Mai multe unghiuri, alt unic fiecare** — față, spate, detaliu, lifestyle, referință scară.
- **Raport de aspect și fundal consistent** — alb sau decupaj transparent pentru marketplace-uri; poze lifestyle pentru hero-uri pe site-ul brand. Vezi [elimină fundalul fără Photoshop](/ro/blog/remove-background-without-photoshop) pentru decupaje curate de catalog via [Eliminare Fundal](/ro/eliminare-fundal).
- **Rezoluție pregătită pentru zoom** — redimensionează la dimensiunea maximă de afișare a platformei, nu peste; comprimă după redimensionare.
- **Text suport unic** — descrieri duplicate de la producător plus poze identice creează conținut subțire; adaugă specificații, cazuri de utilizare și tabele comparative.

### Galerii produs, zoom și listări marketplace

Galeriile on-site ar trebui să folosească HTML semantic sau componente accesibile cu thumbnail-uri navigabile de la tastatură. Fiecare thumbnail leagă un URL sau stare distinctă cu alt potrivit. Marketplace-urile pot re-găzdui imaginile pe CDN-ul lor — SEO-ul on-site beneficiază totuși de originale optimizate care se încarcă rapid înainte de syndication.

Date structurate Product cu array-uri `image` corecte îmbunătățesc eligibilitatea pentru rich results de produs unde Google afișează imagini alături de preț și disponibilitate.

## Evitarea conținutului duplicat și subțire cu imagini

Publicarea aceleiași poze stock pe cincizeci de articole cu text wrapper subțire creează semnale vizuale duplicate. Motoarele pot indexa imaginea o dată și demota paginile repetitive. Site-urile e-commerce care clonează feed-uri de la producător au același pattern.

Strategii de atenuare:

- **Adaugă imagini unice unde e posibil** — fotografie originală, capturi annotate, diagrame custom.
- **Personalizează alt și caption per context** — aceeași poză de produs pe un articol comparativ vs un ghid de mărimi nu ar trebui să aibă copy identic în jur.
- **Folosește tag-uri canonical** pe pagini care trebuie să existe dar sunt aproape duplicate — pointează către URL-ul principal.
- **Combină stock cu valoare** — dacă folosești stock, adaugă tabele, pro/contra sau walkthrough-uri video originale pe care furnizorul stock nu le oferă.

Evită hotlinking de imagini de pe alte domenii — pierzi control, se strică când sursele se mută și trimiți trafic în altă parte. Găzduiește pe CDN-ul tău cu licențiere corectă.

Pentru adâncime format și compresie, deferă la [cel mai bun format de imagine pentru site-uri în 2026](/ro/blog/best-image-format-for-websites-2026), [AVIF vs WebP vs JPEG](/ro/blog/avif-vs-webp-vs-jpeg-which-format) și [WebP vs PNG avantaje și dezavantaje](/ro/blog/webp-vs-png-pros-and-cons) în loc să repeți tabele de codec aici.

## Un workflow practic PixiqueAI pentru SEO imagini

Un pipeline repetabil leagă uneltele de optimizare de metadata SEO:

1. **Redenumește înainte de upload** — nume descriptiv cu cratime reflectând subiectul și varianta.
2. **Editează și elimină fundalul** pentru decupaje produs cu [Eliminare Fundal](/ro/eliminare-fundal) — vezi [elimină fundalul fără Photoshop](/ro/blog/remove-background-without-photoshop).
3. **Redimensionează** la dimensiunile exacte de afișare (plus multiplicator retina) cu [Redimensionare Poze](/ro/redimensionare-poze) — urmează [redimensionează imagini pentru orice dispozitiv](/ro/blog/resize-images-for-any-device).
4. **Convertește format** dacă e nevoie conform [celui mai bun format de imagine pentru site-uri în 2026](/ro/blog/best-image-format-for-websites-2026).
5. **Comprimă ultimul** cu [Compresorul de imagini](/ro/compresie-poze) — detalii în [comprimă imagini fără pierdere de calitate](/ro/blog/compress-images-without-losing-quality) și [impact PageSpeed](/ro/blog/how-image-compression-improves-pagespeed).
6. **Scrie alt text unic** și caption opțional în CMS — nu lipi în lot aceeași string pe o galerie.
7. **Setează lățime și înălțime** în markup; lazy load doar sub fold.
8. **Configurează og:image** și schema product/article cu URL-uri absolute potrivite.
9. **Include imaginile în sitemap-ul de imagini** pentru cataloage mari sau galerii JS-heavy.
10. **Validează** cu Rich Results Test, Lighthouse și rapoarte Search Console.

SEO pentru imagini nu e o bifă unică. E denumire, accesibilitate, date structurate, previzualizări social și performanță care lucrează împreună. Imaginile rapide și bine descrise rankează mai bine, convertesc mai bine și ajung la utilizatori prin căutare, social și tehnologii assistive — de la primul crawl al numelui fișierului până când un cumpărător face zoom pe detaliul unui produs.
