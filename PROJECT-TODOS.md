# Openstaande punten

Alleen punten die nog echt open staan. Besluiten staan in `docs/besluiten.md`.

## Content en bedrijfsgegevens

- [ ] **Behandeltijden extensions:** gratis consult, nieuwe plaatsing en omhoogplaatsen (per 1–4 banen). Tot die tijd niet publiek boekbaar. **Het consult is het belangrijkst:** zonder die duur kan een nieuwe extensionsklant online niets aanvragen.
- [ ] **Acryl babyboom/colourboom:** behandelduur van de nieuwe set. Tot die tijd incompleet en niet boekbaar.
- [ ] **"Verwijderen bij een nieuwe set: € 15 extra":** de uitleg moet bevestigd worden. Op dit moment opgevat als € 15 voor het verwijderen, náást de prijs van de nieuwe set. Niet als definitief tonen.
- [ ] **Bewaartermijn** van voorbeeldfoto's voor nail art.
- [ ] **E-mailadres** van NovaLuxe: afzender, reply-to en het adres voor meldingen aan Jessie.
- [ ] **Privacyverklaring en algemene voorwaarden:** de inhoud aanleveren. Nodig vanwege persoonsgegevens en foto-uploads (AVG).

## Merk en beeld

- [ ] **Logo** aanleveren, bij voorkeur als SVG. Daarna het tijdelijke woordbeeld in de header vervangen (`src/components/brand/wordmark.tsx`).
- [ ] **Prijslijst-afbeelding** aanleveren, voor het kalibreren van de kleuren.
- [ ] **Bestaande foto's** van haar werk aanleveren.
- [ ] **Nieuwe fotografie** van Jessie en de salon (gepland deze week). Zie `PHOTO-SHOTLIST.md`.

## Techniek en infrastructuur

- [ ] **Vercel-omgeving:** `DATABASE_URL` en `DATABASE_URL_UNPOOLED` instellen, en de functions-regio op Frankfurt (`fra1`) zetten zodat app en database (Neon `aws-eu-central-1`) dicht bij elkaar staan. De build leest openingstijden en prijzen uit de database.
- [ ] **Vercel-project** koppelen. Pro-plan of externe cron nodig voor de geplande taken (verlopen aanvragen, agenda-sync, opruimen van uploads).
- [ ] **Mailprovider** kiezen en de credentials instellen.
- [ ] **Storageprovider** kiezen voor de private uploads.
- [ ] **iCloud:** een test-Apple-ID voor de spike, en daarna een app-specifiek wachtwoord voor de agenda van Jessie.
- [ ] **Domein** koppelen.
- [ ] **Favicon en app-icoon** maken uit het logo (de standaard-favicon van Next.js is verwijderd).
- [ ] **Bij livegang:** `robots: noindex` in `src/app/layout.tsx` verwijderen.
