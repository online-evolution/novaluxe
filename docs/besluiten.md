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
