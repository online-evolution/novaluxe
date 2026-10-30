# Besluiten

Vastgestelde uitgangspunten voor de bouw. Hier staat alleen wat besloten is; open punten staan in `PROJECT-TODOS.md`.

## Merk en layout

- **Huisletter: Familjen Grotesk**, voor koppen én tekst. Er is geen serif. Gekozen na twee specimenrondes:
  - de serif+sans-paren voelden te AI-achtig;
  - Schibsted Grotesk en Archivo (smal) vielen ook af.
- **Opmaak zonder AI-trucs:** geen cursief accentwoord, geen labels in kapitalen met letterspatiëring, geen glassmorphism.
- **Mobiele navigatie:**
  - een vaste balk onderin met "Menu" en "Afspraak maken";
  - het menu opent van onderaf als genummerde inhoudsopgave, met het native `<dialog>`-element;
  - op `/reserveren` vervalt de afspraakknop in de balk.
- **Desktopheader:** zonder achtergrondvlak en niet sticky.
- **Footer:** een colofon met adres en contact groot, zonder kolommenraster.
- **Logo:**
  - het origineel staat in `docs/bron/logo/novaluxe.svg` (getraceerd, ±440 KB); de site toont daarvan gerenderde PNG's uit `public/brand/`;
  - in de kopregel staat het volledige logo, minimaal 128 px breed, omdat de naam zichtbaar moet zijn; in het beheer staat het monogram;
  - het volledige logo staat ook bovenaan de footer;
  - favicon (`src/app/icon.png`) en app-icoon (`src/app/apple-icon.png`) zijn uit het monogram gemaakt.

- **Homepage (concept Salonkaart, `docs/concepten/salonkaart.html`):**
  - De eerdere concepten vonden we te AI-achtig: abstracte vormen als fotovervanging, dunne lijntjes en genummerde blokken.
  - Opening: de salonfoto (S04) direct onder de kopregel, schermvullend, met gecentreerde kop en gouden knop; de onderkant vervaagt in de pagina. De foto pant langzaam door de ruimte en licht trekt erover, met CSS-animaties: de foto wordt nooit vervormd. Op mobiel blijft hij liggend (3:2) met de tekst eronder.
  - Afgewezen voor de opening: een raam in de logocirkel, vloeibaar goud, een donkere avondversie, diepte-effecten en waaiende planten.
  - Opbouw: opening met de salonfoto (S04) → extensions en nagels met elk één foto → prijskaart met puntlijntjes → aandacht met de salonfoto → Jessie met portret op donker brons → werk → afspraak. Er is geen foto per behandeling nodig, wel een foto per plek.
  - Kleuren: de huisstijl (ivoor, crème, brons, inkt). De variant in kastanje en goud is afgewezen.
- **Andere pagina's:** dezelfde vormtaal, via `src/components/page`:
  - opening gecentreerd op ivoor (`PageOpening`), blokken in crème, ivoor of één keer brons (`PageSection`), afsluiter gecentreerd (`PageClosing`);
  - prijzen en openingstijden met puntlijntjes (`DottedRow`);
  - koppen semibold; geen genummerde secties, geen labels boven koppen en geen dunne lijnen.
- **Fotoplekken blijven zichtbaar:** een plek zonder foto staat als lege plek met de code, tot de foto in het beheer is geplaatst.

## Bron van waarheid

- Neon (Postgres) is leidend voor alle NovaLuxe-afspraken. De iCloud-agenda is een synchronisatielaag.
- Prijzen, behandeltijden, openingstijden, uitzonderingen, blokkades en boekingsregels staan in de database. Jessie wijzigt ze in de admin, zonder deploy.
- Bedragen worden opgeslagen in centen. Tijdstippen staan als `timestamptz` (UTC). Businesslogica rekent in `Europe/Amsterdam`.

## Afspraakaanvragen

- Een klant doet altijd een aanvraag (`pending`). Pas na acceptatie door Jessie wordt die `confirmed` en gaat de bevestigingsmail eruit.
- Klanten kunnen niet zelf annuleren of verplaatsen.
- Een `pending` aanvraag houdt het tijdslot vast tot `expires_at`:
  - `expires_at = least(created_at + pendingHoldHours, start_at)`. Een aanvraag kan dus nooit pas na het begin van de afspraak verlopen.
  - Startwaarde van `pendingHoldHours` is 12 (instelbaar).
  - De beschikbaarheid telt een `pending` aanvraag met `expires_at <= now()` als vrij. De juistheid hangt dus niet af van een cronjob.
  - In de boekingstransactie worden verlopen aanvragen eerst op `expired` gezet. Daarna pas volgt de insert, zodat de exclusion constraint (`pending`/`confirmed`) ze niet meer meetelt.
- Dubbele boekingen voorkomen we op drie niveaus:
  1. de server rekent de beschikbaarheid opnieuw uit;
  2. een transactie met advisory lock;
  3. een exclusion constraint op `tstzrange(start_at, end_at)`.

## Datamodel (Fase 8)

- **Neon:** project `novaluxe` (`lingering-star-28236795`) in `aws-eu-central-1` (Frankfurt), Postgres 18.
  - De app gebruikt de pooled verbinding.
  - Migraties gebruiken de directe verbinding.
- **Twee Neon-branches:**
  - `main` is productie. Vercel gebruikt hem, en lokaal staat hij in `.env.production.local`.
  - `dev` is voor lokale ontwikkeling en testdata, in `.env.local`.
  - `npm run db:migrate` werkt op `dev`. `npm run db:migrate:prod` werkt bewust op productie.
  - Na een schemawijziging migreer je eerst `dev`, dan pas productie, vóór de deploy die het nieuwe schema nodig heeft.
- **Catalogus:**
  - `treatments` is wat de klant in stap 2 kiest. `publiclyBookable = false` voor een nieuwe plaatsing.
  - `treatment_variants` bevat prijs en duur per afwerking, lengte en banen. Een lege prijs of duur betekent incompleet en niet boekbaar.
  - `treatment_options` bevat nail art en verwijderen vóór een nieuwe set. Met `priceConfirmed` worden onbevestigde prijzen nooit als feit getoond.
  - `treatment_option_rules` legt vast bij welke behandelingen en welk soort variant een optie kan.
- **Planning:**
  - `business_hours`: lokale tijden per weekdag. Meerdere rijen per dag zijn vaste pauzes.
  - `availability_exceptions`: per datum gesloten of afwijkende tijden.
  - `blocked_periods`: pauze, vakantie, privé.
  - `settings`: sleutel-waarde, gecontroleerd met Zod in `src/domain/settings.ts`, met een standaardwaarde per sleutel.
- **Boekingen:**
  - `appointments` bewaart een momentopname van naam, prijs en duur.
  - `appointment_options`, `appointment_events` (logboek) en `customers` (uniek op `lower(email)`).
  - `extension_releases`: eenmalige vrijgave na een consult, met het token alleen als hash.
- **Afgedwongen in de database:**
  - geen overlap tussen `pending` en `confirmed` (exclusion constraint);
  - een aanvraag verloopt nooit na de start;
  - nail-artomschrijving alleen als nail art is gevraagd;
  - geldige weekdagen en tijdvakken.
- **Seed:** voegt alleen ontbrekende rijen toe en overschrijft nooit wijzigingen van Jessie (`npm run db:seed`).
- **Later:** admin-accounts, uploads, e-mail en agenda-sync krijgen hun tabellen in hun eigen fase.

## Admin-inloggen (Fase 9)

- **Geen openbare registratie.** Beheerders worden aangemaakt met `npm run admin:create`, dat een willekeurig wachtwoord genereert. Daarna wijzigt de beheerder het zelf onder Account.
- **Wachtwoorden:** scrypt (N=2¹⁷, r=8, p=1, 64 bytes), met de parameters in de hash zodat ze later verhoogd kunnen worden.
  - Minimaal 12 tekens.
  - Ook een onbekend e-mailadres krijgt een hashcontrole, zodat de responstijd niet verraadt of een account bestaat.
- **Sessies:** een willekeurig token van 32 bytes in een cookie.
  - De cookie is `httpOnly`, `SameSite=Lax`, en in productie `Secure` met het `__Host-`-voorvoegsel.
  - In de database staat alleen de SHA-256-hash van het token.
  - Een sessie geldt 30 dagen.
  - Bij een wachtwoordwijziging worden andere sessies beëindigd.
- **Autorisatie:**
  - `requireAdmin()` in elke adminpagina en elke serveractie.
  - `proxy.ts` stuurt alleen optimistisch door als er geen cookie is.
  - Serveracties zijn met de Origin-controle van Next.js beschermd tegen CSRF.
- **Rate limiting:** maximaal 5 mislukte pogingen per e-mailadres en 20 per IP-adres per 15 minuten.
  - De sleutels staan als HMAC met `AUTH_SECRET` in de database.
  - Een geslaagde login wist de teller voor dat e-mailadres.
- **Cache Components:** het lezen van de sessie gebeurt binnen `<Suspense>`. De adminpagina's zijn partial prerendered.

## Instellingenbeheer (Fase 12)

- **Behandelingen:** Jessie past per variant de prijs, de duur en aan/uit aan, en per behandeling aan/uit.
  - Een lege prijs of duur betekent "nog niet online te boeken".
  - Nieuwe behandelingen toevoegen kan nog niet; dat bouwen we pas als er vraag naar is.
- **Extra opties:**
  - Nail art: prijs per nagel. De extra tijd staat onder Instellingen.
  - Verwijderen vóór een nieuwe set: prijs, duur, en "prijs klopt en mag op de website".
- **Openingstijden:**
  - De vaste week, met per dag een optionele pauze; intern zijn dat twee tijdvakken.
  - Afwijkende dagen: dicht, of andere tijden.
  - Blokkades: van datum en tijd tot datum en tijd. Jessie typt Nederlandse tijd; opgeslagen wordt UTC (`zonedDateTimeToUtc`, getest rond zomer- en wintertijd).
- **Instellingen:** de boekingsregels, uitgelegd in gewone taal, en gecontroleerd met hetzelfde Zod-schema als bij het lezen.
- **Cache:**
  - Na een wijziging roept de serveractie `updateTag()` aan, zodat de publieke site direct bijgewerkt is.
  - Blokkades hebben geen publieke cache; daar vernieuwt `refresh()` alleen het adminscherm.
- **Formulieren:**
  - React leegt formulieren standaard na een actie. `ActionForm` voorkomt dat, zodat invoer na een foutmelding blijft staan.
  - Alleen formulieren die iets toevoegen worden na succes leeggemaakt.
- **Tests:** `npm test` (node:test) voor de geldinvoer en de tijdzone-omzetting.

## Reserveringsflow (Fase 10)

- **Stappen:** categorie → behandeling → afwerking en opties (alleen als er iets te kiezen is) → datum en tijd → gegevens → controle → "Afspraak aanvragen".
  - Keuzes blijven bewaard bij teruggaan.
  - Een deep link kiest alvast iets: `?categorie=nagels` of `?behandeling=<slug>`.
- **Beschikbaarheid:**
  - wordt berekend op de server (`src/domain/availability.ts`, getest) via `GET /api/beschikbaarheid`;
  - openingstijden of een afwijking voor die datum, min bevestigde afspraken, niet-verlopen aanvragen en blokkades;
  - met de behandelduur plus opties plus de nail-artbuffer, de tijdstappen, de minimale aanvraagtijd, de maximale weken vooruit, en "klaar vóór sluitingstijd".
- **Opslaan** (`src/server/booking/request.ts`): één transactie met een advisory lock.
  1. Verlopen aanvragen op `expired` zetten, met een regel in het logboek.
  2. Keuze, prijs en duur vers uit de database halen.
  3. De tijd opnieuw toetsen.
  4. De klant opslaan (één per e-mailadres) en de aanvraag als `pending` vastleggen, met een momentopname van de opties.
  - Daarna weigert de exclusion constraint nog overlap.
  - Getest: bij twee gelijktijdige aanvragen slaagt er precies één.
- **Een tijdstip dat intussen weg is:** de klant gaat terug naar datum en tijd, met een melding en opnieuw geladen tijden. Alle andere keuzes blijven bewaard.
- **Prijs:** het totaal bevat alleen bevestigde prijzen. Nail art (€ 1 per nagel) en een onbevestigde meerprijs staan erbij als "volgt".
- **Spam en misbruik:**
  - een honeypot-veld en een minimale invultijd van 4 seconden (bots krijgen dezelfde bevestigingspagina);
  - maximaal 5 aanvragen per uur per IP-adres (`rate_limit_events`, HMAC-sleutels);
  - invoercontrole met Zod op de server.
- **Na versturen:** `/reserveren/ontvangen`, met de goedgekeurde tekst en zonder persoonsgegevens in de URL.

## Afsprakenbeheer (Fase 11)

- **Schermen:**
  - *Vandaag*: open aanvragen (met hoe lang de tijd nog wordt vastgehouden), de agenda van vandaag en morgen;
  - *Afspraken*: Aanvragen, Komend en Eerder;
  - een detailpagina per afspraak met klant, behandeling, opties, nail art, opmerking, prijs, notitie voor Jessie, andere afspraken van de klant en een logboek;
  - *Afspraak toevoegen* voor afspraken die Jessie zelf maakt (telefonisch, in de salon). Die zijn meteen bevestigd. Het e-mailadres van de klant is daarbij optioneel; `customers.email` mag daarom leeg zijn (migratie 0004).
- **Acties per status** (`src/domain/appointment.ts`, getest):
  - aanvraag: bevestigen of afwijzen;
  - verlopen aanvraag waarvan de tijd nog komt: alsnog bevestigen, als de tijd nog vrij is;
  - bevestigd en nog niet begonnen: verplaatsen of annuleren;
  - bevestigd en begonnen: geweest, niet gekomen of annuleren;
  - geweest en niet gekomen kunnen naar elkaar worden gecorrigeerd.
  - Afwijzen en annuleren staan ingeklapt, zodat ze niet per ongeluk gebeuren. Elke wijziging komt in het logboek.
- **Plannen door Jessie** (verplaatsen, zelf toevoegen):
  - de klantregels (minimale aanvraagtijd, weken vooruit) gelden niet;
  - nooit over een andere afspraak of lopende aanvraag heen;
  - buiten de openingstijden of over een blokkade alleen met het vinkje "Toch inplannen".
- **Eén lock voor alles:** online aanvragen, bevestigen, verplaatsen, zelf toevoegen en aanvragen via een vrijgavelink gebruiken dezelfde advisory lock en dezelfde bouwstenen (`src/server/booking/core.ts`). De exclusion constraint blijft het laatste vangnet.
- **Nog geen berichten aan de klant:** de e-mail volgt in Fase 13. Tot die tijd meldt het beheer bij bevestigen en afwijzen dat Jessie de klant zelf moet inlichten.

## Vrijgave nieuwe plaatsing (extensions)

- Gekozen: een **eenmalige link met token** (eenvoudigste veilige vorm). Geen klantaccount en geen vlag die de openbare flow verandert.
- **Jessie maakt de vrijgave** bij een extensions-afspraak van de klant (meestal het consult):
  - lengte en banen, de duur (verplicht, want die staat nog niet in de prijslijst), de prijs (leeg = prijslijst), een optionele aanbetaling en kleurafspraken;
  - "Link werkt tot en met": standaard ingevuld op 4 weken, per link aan te passen;
  - de link wordt één keer getoond om te kopiëren. In de database staat alleen de SHA-256-hash van het token.
- **De klant** opent `/reserveren/plaatsing/<token>`:
  - ziet wat er is afgesproken en kiest een tijd uit de vrije tijden voor precies die duur, met dezelfde regels als de openbare flow;
  - de pagina wordt niet geïndexeerd en stuurt geen referrer mee;
  - het resultaat is een gewone aanvraag (`source = release`) die Jessie bevestigt.
- **Hoe vaak de link werkt:** zolang er geen lopende aanvraag of bevestigde afspraak aan hangt. Wordt de aanvraag afgewezen of verloopt die, dan kan de klant met dezelfde link een andere tijd kiezen (tot de einddatum). Bij bevestigen wordt `used_at` gezet. Jessie kan een link intrekken.
- **Aanbetaling:** alleen bedrag en "ontvangen ja/nee". Geen betaalintegratie (masterprompt §30).
- Basis-URL van de link: `SITE_URL`, of anders het adres waarop het beheer draait.

## Caching

- `cacheComponents` staat aan. Catalogus, openingstijden en instellingen worden gelezen via `"use cache"` met een tag uit `src/server/cache-tags.ts`.
- Publieke pagina's blijven statisch. Een adminwijziging roept `updateTag(...)` aan en is daarna direct zichtbaar, zonder deploy.

## Boekingsregels (startwaarden, instelbaar)

| Regel | Startwaarde |
|---|---|
| Tijdslotinterval | 15 minuten |
| Minimaal vooraf | 12 uur |
| Maximaal vooruit | 8 weken |
| Behandeling klaar vóór sluitingstijd | ja |
| Pending-termijn | 12 uur |
| Nail-artbuffer | 15 minuten |
| Gratis consult extensions | 15 minuten |

## Openingstijden (startwaarden, instelbaar)

| Dag | Tijden |
|---|---|
| Ma–wo, vr | 09:00–18:00 |
| Do | 09:00–20:00 |
| Za | 09:00–14:00 |
| Zo | gesloten |

## Behandelingen

- **Nail art** kan alleen bij gellak, BIAB en acryl, niet bij manicure naturel.
  - Toon "€ 1 per nagel". Reken geen eindtotaal uit.
  - De klant beschrijft wat ze wil en kan maximaal 3 voorbeeldfoto's toevoegen.
  - De extra tijd is de instelbare `nailArtDefaultBufferMinutes`. Jessie beoordeelt de aanvraag vóór bevestiging.
- **Verwijderen** (acryl, BIAB, gellak/rubber base) duurt 20 minuten.
  - Als toevoeging vóór een nieuwe set: ook +20 minuten.
  - Prijs en duur zijn instelbaar. De €15-regel is nog onbevestigd.
- **Acryl babyboom/colourboom:** de nieuwe set is technisch aanwezig, maar *incompleet* zolang de duur ontbreekt. Opvullen kan niet online.
- **Een variant zonder duur** is niet publiek boekbaar. We verzinnen geen tijden.
- **Extensions:**
  - Omhoogplaatsen (1–4 banen) mag ook door nieuwe klanten worden aangevraagd. Online boekbaar zodra de duur bekend is.
  - Een nieuwe plaatsing kan alleen via een vrijgave door Jessie na het consult: een eenmalige, gehashte link met vervaldatum.
  - De aanbetaling is alleen een status die Jessie bijhoudt. Er komt geen betaalintegratie.

## E-mail

- Workflow:
  - nieuwe aanvraag → melding naar Jessie;
  - bevestigd → bevestigingsmail naar de klant;
  - afgewezen → Jessie handelt de afwijzing of het contact af.
- Er is één server-side `MailService` met één adapter per provider. Afzender en ontvangers zijn centraal instelbaar. We gebruiken geen voorlopig adres alsof het definitief is.

## Foto's op de website

- **Beheer → Foto's**, in drie delen:
  - *Voor en na*: twee foto's per paar, op de homepage als transformatie (maximaal drie, bij Werk). Het resultaat golft van boven naar beneden over het voor, met een zachte golvende rand die zijwaarts meedeint en een lichtstreep. Daarna veert het resultaat zacht op zijn plek en flonkeren even drie ✦-sterretjes uit het logo. Dat speelt één keer vanzelf af als de foto in beeld komt. Tikken speelt het terug en weer vooruit. Met "minder beweging" ingesteld start niets vanzelf en is het een rustige overgang. (Een schuifregelaar en drie statische varianten zijn afgewezen.)
  - *Werk*: losse foto's; op de homepage staan de eerste acht, in Jessies volgorde (zonder foto's staan er lege plekken);
  - *Vaste plekken*: één foto per shotcode uit `PHOTO-SHOTLIST.md` (`src/config/photo-shots.ts`). Zonder foto staat er een lege plek met de code.
  - Per foto een optioneel onderschrift, een beschrijving (alt-tekst) en welk deel zichtbaar moet blijven bij bijsnijden (boven, midden, onder).
- **Staande foto's eerst:** Jessie levert vooral staand aan. Alle fotoplekken zijn daarom staand (4:5, 3:4 of 2:3) of vierkant; de liggende plekken en de banden van 21:9 zijn omgezet.
- **Verwerking:**
  - de browser verkleint de foto eerst tot 2000 px (canvas; dat laat ook de metadata achter);
  - de server controleert met `sharp` of het echt een JPG, PNG of WebP is, zet de foto rechtop, verkleint tot maximaal 2000 px, slaat op als JPG (kwaliteit 90) en verwijdert alle metadata (zoals de GPS-locatie);
  - een foto met een korte zijde onder 600 px wordt geweigerd;
  - serveracties accepteren maximaal 4 MB (Vercel staat 4,5 MB per verzoek toe).
- **Opslag** achter een kleine interface (`src/server/storage`):
  - productie: **Vercel Blob**, store `novaluxe-fotos` in fra1, openbaar (de foto's staan toch op de website), via `BLOB_READ_WRITE_TOKEN`;
  - lokaal zonder token: `public/uploads` (niet in git);
  - in de database (`images`, `site_photos`, `gallery_items`) staan alleen de verwijzing en de afmetingen;
  - vervangen of verwijderen ruimt het oude bestand op.
- Na elke wijziging ververst `updateTag("photos")` de website direct.

## Uploads

- Private object storage achter een kleine storage-interface, zodat de provider vervangbaar is.
- Maximaal 3 afbeeldingen per aanvraag. Type en grootte worden server-side gecontroleerd.
- Ze worden verwijderd na een instelbare bewaartermijn.

## iCloud

- Eerst een losstaande spike met een test-Apple-ID, niet met het account van Jessie.
- Credentials staan alleen in server-omgevingsvariabelen. Nooit in de database, de broncode of de logs.
- Bij voorkeur een aparte agenda "NovaLuxe".
- Van privéafspraken slaan we alleen begin, einde en bezet/vrij op.
- Wijzigingen op de iPhone overschrijven nooit stilzwijgend de database. We detecteren de afwijking en Jessie kiest in de admin wat er gebeurt.
- De integratie komt pas in de kern van de applicatie als de spike betrouwbaar blijkt.

## Infrastructuur

- **Vercel-project:** `novaluxe` (`prj_fDPRn3wbSlpEiL78kBJpNWO7vVHw`).
  - Gekoppeld aan GitHub `online-evolution/novaluxe`: elke push naar `main` deployt naar productie.
  - Functions draaien in `fra1` (Frankfurt), naast de database.
  - `DATABASE_URL` en `DATABASE_URL_UNPOOLED` staan er als sensitive variabelen.
  - Productie-URL tot het domein gekoppeld is: `novaluxe-seven.vercel.app` (noindex).

- De architectuur gaat uit van een commerciële productieomgeving (Vercel Pro of externe cron). Ze leunt niet op Hobby-beperkingen.
