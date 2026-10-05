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

- De architectuur gaat uit van een commerciële productieomgeving (Vercel Pro of externe cron). Ze leunt niet op Hobby-beperkingen.
