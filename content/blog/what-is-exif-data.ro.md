---
slug: what-is-exif-data
locale: ro
publishedAt: 2026-06-25
seoTitle: Ce este EXIF? — Metadata cameră, GPS și confidențialitate
title: Ce este EXIF?
metaDescription: Află ce sunt datele EXIF — ISO, diafragmă, timp expunere, locație GPS, orientare, copyright și software. Când păstrezi sau elimini metadata, riscuri de confidențialitate, stripping pe social media, dimensiune fișier web și vizualizare EXIF pe Mac, Windows și online.
ogTitle: Ce este EXIF?
ogDescription: Ghid practic despre metadata foto — ce înregistrează EXIF, de ce contează pentru fotografi, riscuri GPS, când platformele elimină tag-urile și cum compresia afectează EXIF pe web.
excerpt: Fiecare poză poate purta metadata invizibilă — setări cameră, dată și oră, uneori coordonate GPS exacte. EXIF ajută fotografii să învețe și să organizeze, dar poate expune locația și detalii personale pe care nu le-ai vrut publicate.
ctaHeading: Comprimă imaginile și elimină metadata grea
ctaBody: Încarcă JPG, PNG, WebP sau AVIF și reduce dimensiunea pentru pagini mai rapide. Re-encodarea pentru web elimină adesea EXIF de care nu ai nevoie — un pas simplu spre fișiere mai mici și confidențialitate mai bună înainte de share.
ctaButton: Deschide Compresor Imagini
ctaToolSlug: compresie-poze
faq: [{"question":"Ce înseamnă EXIF?","answer":"EXIF vine de la Exchangeable Image File Format — un standard pentru stocarea metadata în fișiere imagine, cel mai des JPEG și TIFF, uneori PNG sau WebP când exportatorii încorporează tag-uri. Datele descriu cum a fost capturată fotografia, nu pixelii vizibili."},{"question":"Pot datele EXIF să dezvăluie adresa mea?","answer":"Dacă etichetarea GPS era activă când ai făcut poza, EXIF poate stoca latitudine și longitudine suficient de precise pentru a identifica o clădire sau o cameră. Mulți publică accidental locația partajând fișiere originale de cameră pe social media, forumuri sau anunțuri. Elimină tag-urile GPS înainte de upload public dacă confidențialitatea locației contează."},{"question":"Platformele social media elimină EXIF automat?","answer":"Majoritatea platformelor mari elimină o parte sau tot EXIF la upload — inclusiv GPS — dar politicile variază și se schimbă. Nu te baza pe platformă pentru protecție. Elimină metadata sensibilă singur înainte de publicare, mai ales pentru imagini partajate în afara rețelelor sociale mainstream."},{"question":"Eliminarea EXIF reduce dimensiunea fișierului?","answer":"Adesea da, deși economiile depind de câtă metadata era încorporată. Trasee GPS, thumbnail-uri și note maker lungi pot adăuga kilobytes până la megabytes. Pentru web, eliminarea EXIF inutil e o parte mică dar reală a optimizării alături de redimensionare și compresie — vezi ghidul comprimă imagini fără pierdere de calitate."},{"question":"Fotografii ar trebui să păstreze EXIF pe export?","answer":"Păstrează EXIF pe master-ele de arhivă și când trimiți clienților sau editorilor care au nevoie de setările de captură. Elimină sau minimizează pentru galerii web publice, submisii stock cu cerințe de confidențialitate și orice imagine unde GPS sau numere de serie trebuie să rămână private. Alegerea depinde de audiență și caz de utilizare."},{"question":"Cum pot vedea datele EXIF pe computer?","answer":"Pe Mac, selectează fișierul în Finder și deschide Informații, sau folosește Previzualizare → Instrumente → Arată inspectorul. Pe Windows, click dreapta → Proprietăți → Detalii. Vizualizatoarele EXIF online funcționează în browser pentru verificări rapide. Verifică mereu metadata înainte de a încărca originale pe web."}]
relatedLinks: [{"href":"/ro/blog/blur-faces-in-photos-for-privacy","label":"Blur fețe în poze pentru confidențialitate"},{"href":"/ro/blog/compress-images-without-losing-quality","label":"Comprimă imagini fără pierdere de calitate"},{"href":"/ro/blog/how-to-optimize-images-for-seo","label":"Cum optimizezi imaginile pentru SEO"},{"href":"/ro/compresie-poze","label":"Compresor de imagini"}]
---

Faci o poză, o trimiți, și presupui că lumea vede doar ce e în cadru. În spatele pixelilor, însă, majoritatea imaginilor de pe cameră sau telefon poartă un strat invizibil de informații numit **date EXIF** — setările folosite la captură, data și ora, uneori coordonatele GPS exacte unde stăteai, chiar și tag-uri de copyright sau software adăugate la export.

Pentru fotografi, EXIF e un caiet atașat fiecărui fișier: dovadă a timpului de expunere la o sesiune nocturnă, confirmare că ISO automat nu a urcat prea mult, un timestamp care sortează cronologic o galerie de nuntă. Pentru oricine publică online, EXIF e și o suprafață de confidențialitate. Tag-urile de locație au expus adrese de domiciliu, rutine de vacanță și locuri de muncă sensibile. Rețelele sociale pot elimina metadata la upload, dar nu poți presupune că protecția asta se aplică peste tot.

Acest ghid explică ce este EXIF, ce conține, de ce contează pentru workflow-uri creative și tehnice, când să-l păstrezi versus când să-l elimini, cum interacționează cu optimizarea web și SEO, și cum inspectezi metadata pe Mac, Windows și în browser. Acoperă și context general de confidențialitate și GDPR — nu consultanță juridică, ci suficient ca să decizi informat înainte de publicare.

## Ce este EXIF?

**EXIF** (Exchangeable Image File Format) e un standard de metadata încorporat în multe fișiere imagine digitale. Nu schimbă cum arată poza pe ecran; înregistrează **cum și unde a fost creată imaginea**. Gândește-te la EXIF ca la eticheta de pe un colet — produsul din interior e fotografia, dar eticheta listează originea, instrucțiunile de manipulare și numere de serie.

Tag-urile EXIF sunt stocate în câmpuri structurate: marcă și model cameră, obiectiv, distanță focală, diafragmă, timp expunere, ISO, status bliț, balans de alb, orientare, dată și oră, coordonate GPS opționale, string-uri copyright și software folosit la editare sau export. Unele câmpuri sunt scrise automat de cameră sau telefon la captură. Altele se adaugă ulterior în Lightroom, Photoshop sau la export.

JPEG și TIFF sunt cei mai frecvenți purtători. PNG poate include EXIF în unele workflow-uri, dar adesea poartă mai puține date de captură. Fișierele RAW țin metadata extinsă în sidecar-uri sau headere încorporate. Când convertești sau comprimi pentru web, EXIF poate supraviețui, micșora sau dispărea în funcție de unealtă și setări — ceea ce contează atât pentru **dimensiunea fișierului**, cât și pentru **confidențialitate**.

## Cum se încorporează EXIF când faci o poză

În momentul în care apeși declanșatorul, pipeline-ul de imagine scrie metadata alături de pixeli. Pe o cameră DSLR sau mirrorless, procesorul înregistrează setările de expunere de la sistemul de metering, informații obiectiv de la contactele electronice și date de ceas de la corp. Smartphone-urile fac același lucru prin stack-ul de fotografie computațională — adăugând adesea orientare din accelerometru și, dacă e activat, GPS fusionat din serviciile de locație ale telefonului.

Software-ul de editare poate **citi, modifica sau adăuga** EXIF. Exportul unui JPEG din Lightroom poate reîmprospăta tag-ul software, păstra setările originale de captură sau elimina GPS în funcție de preset. Resalvarea în unele unelte online elimină toată metadata. Re-encodarea prin compresie — cum face [Compresorul de imagini PixiqueAI](/ro/compresie-poze) — produce de obicei un fișier nou optimizat pentru livrare; gestionarea metadata depinde de encoder, dar compresia orientată spre web elimină adesea tag-urile de care nu mai ai nevoie.

Înțelegerea unde intră EXIF în pipeline te ajută să decizi când să-l auditezi: **la captură** (dezactivează GPS dacă nu-l vrei), **la edit/export** (alege preset păstrează sau elimină), și **înainte de upload public** (verifică ce a părăsit folderul).

### EXIF vs IPTC și XMP

Fotografii confundă uneori EXIF cu **IPTC** (legendă, cuvinte cheie, linii de credit pentru editori) și **XMP** (metadata extensibilă Adobe, adesea în sidecar-uri). EXIF tinde spre **date tehnice de captură**; IPTC și XMP spre **catalogare și drepturi**. Toate trei pot coexista într-un fișier. Pentru publisheri web, GPS EXIF și câmpurile de serie sunt de obicei tag-urile cu cel mai mare risc; copyright IPTC poate fi util de păstrat dacă vrei credit conservat.

## Setări cameră în EXIF: ISO, diafragmă și timp expunere

Triada expunerii — **ISO**, **diafragmă** și **timp expunere** — e coloana vertebrală a EXIF pentru fotografii care își revizuiesc munca.

### Sensibilitate ISO

EXIF înregistrează valoarea ISO folosită de cameră: 100, 400, 3200 și așa mai departe. Revizuirea ISO pe o sesiune arată dacă ai subexpus și compensat cu câștig zgomotos, sau dacă ISO automat a urcat mai mult decât voiai într-o sală slab luminată. Pentru învățare, compararea cadrelor clare la ISO mic cu eșecurile la ISO mare învață mai mult decât ghicitul din thumbnail.

### Diafragmă (f-number)

Diafragma — f/1.8, f/4, f/11 — apare în EXIF împreună cu distanța focală. Confirmă alegerile de adâncime de câmp după fapt și ajută să reproduci un look la o sesiune viitoare. Fotografii de evenimente care auditează blur-ul pe poze de grup verifică adesea EXIF primul: obiectivul deschis maxim când ar fi trebuit închis?

### Timp expunere

Timpul de expunere în EXIF arată dacă mișcarea a fost înghețată sau blurată intenționat. 1/20 s raportat explică portrete soft ținute în mână; 1/2000 s documentează setări pentru acțiune rapidă. Asociază datele de expunere cu distanța focală pentru a evalua **regula de siguranță handheld** — ai coborât sub viteze sigure fără stabilizare?

Tag-uri tehnice suplimentare — compensare expunere, mod metering, bliț declanșat, balans alb, serie obiectiv — completează povestea capturii. Nimic din asta nu e vizibil pentru privitori ocazionali, dar e aur pentru workflow-uri conștiente de EXIF și note oneste de portofoliu („ lumină naturală, 85 mm, f/2, 1/500 s, ISO 200”).

## Timestamp-uri, orientare și informații dispozitiv

Dincolo de expunere, EXIF stochează **când** a fost făcută poza conform ceasului camerei, **ce dispozitiv** a capturat-o și **cum** trebuie rotită la afișare.

**Data și ora** sortează loturi după import, mai ales când numele fișierelor sunt generice (`IMG_9842.jpg`). Deriva ceasului se întâmplă — călătorii peste fusuri orare sau ora de vară pot produce secvențe confuze. Sincronizarea ceasului camerei înainte de shoot-uri importante evită haosul în galerie.

**Orientarea** spune viewer-elor și software-ului dacă imaginea necesită rotație de 90°. Unele app-uri ignoră tag-urile de orientare și arată pozele culcate; altele aplică rotația fără re-encodare pixel. Pipeline-urile web care elimină metadata de orientare pot cere rotație fizică înainte de upload.

**Marca, modelul camerei și obiectivul** identifică echipamentul. Inofensiv pentru amatori, dar uneori sensibil pentru jurnaliști, avertizori sau workflow-uri de închiriere unde amprentele echipamentului contează. **Numerele de serie** în note maker pot lega unic un fișier de un corp — relevant în scenarii forensice sau scurgeri.

Pentru web, tag-urile de dispozitiv au **valoare SEO minimă** (acoperit mai jos) dar pot scurge mai mult decât crezi combinate cu GPS sau serii unice.

## Date GPS și riscuri de confidențialitate

Câmpul EXIF cu cele mai mari consecințe pentru confidențialitate e **GPS**: latitudine, longitudine și adesea altitudine. O poză de smartphone făcută acasă poate încorpora coordonate precise la câțiva metri — suficient pentru a localiza o casă pe hartă, infera rutine zilnice din trasee cu timestamp sau expune copii la puncte de ridicare de la școală.

### Cum ajunge locația în poze partajate

GPS EXIF apare când **serviciile de locație** sunt activate pentru app-ul cameră. Mulți utilizatori le activează pentru log de călătorii, apoi uită că sunt pornite pentru poze banale — vânzări garaj, selfie-uri la sală, vizite spital. Partajarea **fișierului original la rezoluție completă** pe forumuri, app-uri de dating, anunțuri sau email păstrează GPS chiar când un screenshot decupat nu l-ar face.

### Adresă de domiciliu și re-identificare

Coordonatele plus timestamp pot confirma **unde locuiește cineva** dacă mai multe postări se grupează în același punct seara. Combinate cu repere vizibile sau numere de apartament în cadru, metadata face re-identificarea mai ușoară fără recunoaștere facială. Confidențialitatea metadata completează confidențialitatea vizuală: ghidul nostru despre [blur fețe în poze pentru confidențialitate](/ro/blog/blur-faces-in-photos-for-privacy) acoperă anonimizarea persoanelor din imagine; eliminarea GPS adresează locația din fișier.

Înainte de publicare deschisă, deschide fișierul într-un viewer EXIF și caută GPS, `Location` sau previzualizări hartă. Elimină tag-urile de locație sau exportă o copie curată. Nu presupune că rețelele sociale le-au eliminat — politicile diferă, iar multe căi de share (hotlink CDN, atașamente email, app-uri de mesagerie) nu elimină metadata deloc.

## Copyright, software și câmpuri autor

EXIF și blocurile metadata înrudite pot purta **notificări copyright**, **nume artist sau autor** și **identificatori software** (`Adobe Photoshop`, plugin-uri export, unelte îmbunătățire AI). Aceste câmpuri susțin atribuirea când vrei credit păstrat în biblioteci stock sau livrări clienți.

Documentează și **proveniența**: dacă imaginea a trecut prin editare grea, upscaling AI sau compresie în lot. Unele platforme citesc tag-uri copyright; multe le ignoră. Pentru livrare profesională, încorporarea `Copyright (C) 2026 Numele tău` în IPTC/EXIF rămâne o practică bună chiar când upload-urile sociale o elimină.

Tag-urile software afectează rar calitatea imaginii, dar pot conta în dezbateri de **transparență jurnalistică** când cititorii întreabă dacă o poză a fost alterată algoritmic. Dacă ai folosit AI pentru a [mări rezoluția imaginii](/ro/blog/how-to-increase-image-resolution), lanțul de export poate înregistra unealta — încă un motiv să auditezi metadata înainte de publicare sensibilă.

## De ce contează EXIF pentru fotografi

EXIF transformă fiecare fișier într-un **jurnal de învățare**. Începătorii compară setări în scene similare. Fotografii de nuntă dovedesc că sincronizarea blițului a funcționat. Fotografi wildlife verifică că nu au lăsat ISO blocat de la un test indoor.

Beneficiile organizatorice contează la fel:

- **Sortare cronologică** când numele fișierelor se resetează zilnic.
- **Audit obiective** — ce distanțe focale folosești efectiv versus ce deții.
- **Depanare expunere** — cadre blurate urmărite la timp expunere lent, nu misfocus.
- **Proofing clienți** — confirmarea că setările de livrare respectă specificațiile contractului.

Workflow-urile de arhivă cer adesea **păstrarea EXIF pe master-e** în timp ce generează derivate fără tag-uri pentru web. Split-ul oglindește cum studiourile țin RAW cu metadata completă și publică JPEG fără GPS. Dacă elimini tag-uri pentru confidențialitate, păstrează un master neatins offline.

## Când păstrezi EXIF — și când îl elimini

Nu există un răspuns universal corect; potrivește politica de metadata cu **audiența și canalul**.

**Păstrează EXIF când:**

- Arhivezi originale și sidecar-uri RAW pentru portofoliu sau asigurare.
- Trimite fișiere colaboratorilor care au nevoie de date expunere.
- Submiți la concursuri foto care verifică data capturii sau reguli cameră.
- Depanezi propria tehnică între sesiuni.

**Elimină sau minimizează EXIF când:**

- Publici pe web deschis, forumuri sau anunțuri unde GPS e risc.
- Încarci imagini cu minori, spații domestice sau locuri de muncă sensibile.
- Livrezi asset-uri marketing unde contează doar pixelii, nu seriile camerei.
- Optimizezi pentru dimensiune minimă după redimensionare — metadata adaugă greutate.
- Respecți politici interne de confidențialitate sau reguli client de prelucrare date.

Eliminarea EXIF nu e același lucru cu anonimizarea fețelor. Fișiere fără locație pot tot identifica oameni vizual. Combină revizuirea metadata cu [blur fețe](/ro/blur-fete) când publici poze de grup sub așteptări de confidențialitate în stil GDPR — context general, nu consultanță juridică.

Compresia și conversia de format sunt puncte practice de eliminare. Re-encodarea printr-un [Compresor de imagini](/ro/compresie-poze) orientat web după redimensionare elimină tag-uri în timp ce micșorează bytes — aliniat cu workflow-ul din [comprimă imagini fără pierdere de calitate](/ro/blog/compress-images-without-losing-quality). Înțelege [compresia lossless vs lossy](/ro/blog/lossless-vs-lossy-compression): recompresia lossy poate elimina metadata ca parte a generării unui bitstream nou, în timp ce un „salvează ca original” neglijent în unele editoare păstrează totul.

## Cum elimină rețelele sociale EXIF automat

Instagram, Facebook, X, LinkedIn și TikTok **re-encodează upload-urile** pentru bandwidth și stocare. Majoritatea elimină **GPS și mult din EXIF** în proces — parțial pentru confidențialitate, parțial pentru că pipeline-urile CDN normalizează fișierele. Tratează asta ca **protecție inconsistentă**, nu garanție.

Comportamentul platformelor se schimbă. Unele păstrează orientarea; altele elimină copyright. App-urile de mesagerie pot trimite fișiere **calitate originală** cu metadata completă dacă utilizatorul selectează opțiunea. Atașamentele email și site-urile personale servesc adesea fișiere **byte cu byte** — EXIF intact.

Cea mai bună practică: **sanitizează înainte de upload** indiferent de destinație. Presupune că următoarea actualizare de politică ar putea păstra mai multă metadata, sau că imaginea va fi descărcată și repartajată în afara pipeline-ului de curățare al platformei.

## EXIF și optimizarea web: impact asupra dimensiunii fișierului

EXIF nu e cel mai mare contributor la greutatea paginii — dimensiunile pixel și calitatea compresiei domină — dar metadata nu e gratuită. **Thumbnail-uri** încorporate, note maker lungi, log-uri GPS și blocuri XMP duplicate pot adăuga zeci de kilobytes sau mai mult per fișier. Pe un blog cu multe imagini sau un catalog de produse, overhead-ul se acumulează.

Ordinea optimizării web rămâne:

1. Redimensionează la dimensiunile de afișare (sau multiplicator retina).
2. Alege format modern (WebP, AVIF) unde e suportat.
3. Comprimă cu setări de calitate reglate.
4. Elimină metadata inutilă ca parte din export.

Asociază cu ghidurile despre [cea mai bună dimensiune imagine pentru încărcare rapidă](/ro/blog/best-image-size-for-faster-website-loading) și [cum compresia imaginilor îmbunătățește PageSpeed](/ro/blog/how-image-compression-improves-pagespeed). Eliminarea metadata e finisaj, nu substitut pentru [compresie lossless vs lossy](/ro/blog/lossless-vs-lossy-compression) conștientă — dar merită inclusă în pipeline-uri batch când publici sute de imagini de galerie.

Unele CDN-uri elimină metadata automat; altele trec fișierele neschimbate. Documentează pipeline-ul ca stakeholderii SEO și legali să știe dacă URL-urile publicate conțin GPS sau tag-uri copyright.

### EXIF afectează SEO-ul?

Sincer: **foarte puțin direct**. Google nu clasează pagini mai sus pentru că EXIF include cuvinte cheie — și umplerea câmpurilor IPTC description cu termeni de căutare nu e o strategie semnificativă. Crawler-ii țin mult mai mult la **alt text**, **nume fișiere**, **context pagină**, **date structurate** și **viteză încărcare** — toate acoperite în [cum optimizezi imaginile pentru SEO](/ro/blog/how-to-optimize-images-for-seo).

Unghiuri SEO indirecte există: fișiere mai mici după eliminare metadata plus compresie îmbunătățesc Core Web Vitals; nume fișiere descriptive atribuite la export contează mai mult decât tag-urile model cameră din EXIF; imaginile Open Graph sunt asset-uri separate al căror EXIF e irelevant dacă dimensiunile și URL-urile sunt corecte. Elimină GPS pentru confidențialitate; elimină metadata voluminoasă nefolosită pentru greutate. Investește efort SEO în markup vizibil și accesibil.

## Cum vezi și editezi EXIF pe Mac, Windows și online

Nu ai nevoie de software pro pentru a audita metadata.

**Pe Mac:** Selectează imaginea în Finder → **Informații** pentru un rezumat. **Previzualizare** → **Instrumente → Arată inspectorul** (⌘I) expune mai multe detalii. App-ul Poze arată câmpuri limitate. App-uri dedicate ca ExifTool (linie de comandă) sau reader-e GUI oferă control complet inclusiv eliminare batch.

**Pe Windows:** Click dreapta pe fișier → **Proprietăți → fila Detalii**. Derulează pentru cameră, GPS și autor. Unele versiuni permit eliminarea proprietăților; unelte third-party oferă curățare batch.

**Online:** Viewer-e EXIF în browser încarcă temporar un fișier și afișează tag-uri parsate — convenabil pentru verificare GPS rapidă înainte de post. Folosește unelte reputabile și evită încărcarea imaginilor confidențiale pe servere necunoscute; inspecția locală e mai sigură pentru conținut sensibil.

**Editare și eliminare:** Preset-urile de export Lightroom și Capture One pot omite locația. Comenzile ExifTool elimină grupuri specifice de tag-uri. Re-exportul prin unelte de compresie web elimină metadata optimizând pentru livrare — util când oricum plănuiai să [comprimi pentru web](/ro/compresie-poze).

Verifică mereu fișierul **descărcat** pe care îl vei publica, nu doar master-ul din folderul de arhivă.

## GDPR, confidențialitate și workflow PixiqueAI practic

Sub framework-uri ca **GDPR** UE, datele personale includ informații care identifică sau pot identifica o persoană. Fotografiile cu indivizi recognoscibili sunt date personale. **Coordonatele GPS** legate de domiciliu, loc de muncă sau locație recurentă pot califica la fel — mai ales combinate cu timestamp-uri.

EXIF stă deci în aceeași conversație cu consimțământul, minimizarea datelor și limitarea scopului — nu pentru că metadata e automat ilegală, ci pentru că **publicarea locației și datelor adjacente identității** fără gândire creează risc. Organizațiile care publică poze evenimente, interior imobiliar sau conținut generat de utilizatori ar trebui să trateze revizuirea metadata ca parte a unui workflow de confidențialitate mai larg alături de anonimizare vizuală.

Acest articol e **informație generală, nu consultanță juridică**. Cerințele variază după jurisdicție, context (știri vs marketing vs HR) și dacă subiecții sunt copii. Consultă un consilier calificat pentru ghidaj obligatoriu. Măsuri tehnice — eliminare GPS, blur fețe, compresie și re-export copii curate — reduc expunerea dar nu înlocuiesc baza legală și munca de policy.

Un pipeline repetabil înainte de orice upload public:

1. **Revizuiește EXIF local** — confirmă GPS, serii și timestamp-uri; decide ce rămâne doar pe master.
2. **Editează și decupează** pentru compoziție; rotește fizic dacă calea de export elimină tag-uri orientare.
3. **Anonimizează dacă e nevoie** — folosește [Blur Fețe](/ro/blur-fete) pentru poze de grup unde oamenii nu ar trebui identificați, conform policy-ului tău.
4. **Redimensionează** la dimensiunile țintă de afișare — fișiere supradimensionate irosesc bandwidth indiferent de metadata.
5. **Comprimă** cu [Compresorul de imagini](/ro/compresie-poze) ca pas final de livrare; re-encodarea pentru web elimină de obicei EXIF de care nu mai ai nevoie micșorând dimensiunea fișierului.
6. **Redenumește descriptiv** pentru SEO (`produs-albastru-fata.webp`) cum descrie ghidul nostru SEO — separat de EXIF, dar parte din aceeași checklist de publicare.
7. **Re-verifică output-ul** într-un viewer EXIF înainte de post pe forumuri, email sau site propriu.

Păstrează un **master de arhivă** cu metadata completă pentru evidențe. Livrează **derivate** optimizate și curățate lumii.

EXIF e ușor de ignorat pentru că nu apare niciodată în cadru. Invizibilitatea asta e exact de ce provoacă surprize — un post superb cu peisaj care scurge o coordonată de acasă, o poză produs cu număr de serie, un JPEG portofoliu umflat de o previzualizare încorporată pe care n-ai știut că există.

Învață ce înregistrează camera ta. Decide ce merită fiecare canal. Păstrează EXIF unde învață și protejează munca ta; elimină-l unde confidențialitatea și performanța contează. Combină igiena metadata cu compresie sensibilă, anonimizare fețe când e cazul și practici SEO centrate pe alt text și nume fișiere — nu tag-uri ascunse.

Pozele tale spun o poveste în pixeli. EXIF spune alta în date. Asigură-te că ambele povești sunt cele pe care vrei să le împărtășești.
