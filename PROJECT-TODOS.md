# Openstaande punten

Alleen punten die nog echt open staan. Besluiten staan in `docs/besluiten.md`.

## Content en bedrijfsgegevens

- [ ] **Behandeltijden extensions:** nieuwe plaatsing en omhoogplaatsen (per 1–4 banen). Tot die tijd niet publiek boekbaar. Het gratis consult (15 minuten) is wel compleet.
- [ ] **Acryl babyboom/colourboom:** behandelduur van de nieuwe set. Tot die tijd incompleet en niet boekbaar.
- [ ] **"Verwijderen bij een nieuwe set: € 15 extra":** de uitleg moet bevestigd worden. Op dit moment opgevat als € 15 voor het verwijderen, náást de prijs van de nieuwe set. Niet als definitief tonen.
- [ ] **Bewaartermijn** van voorbeeldfoto's voor nail art.
- [ ] **Bewaartermijn contactberichten:** berichten via het contactformulier blijven nu staan tot Jessie ze verwijdert (Beheer → Berichten). Termijn vaststellen en automatisch opruimen; vermelden in de privacyverklaring.
- [ ] **E-mailadres** van NovaLuxe: afzender, reply-to en het adres voor meldingen aan Jessie.
- [ ] **Beheerdersaccount voor Jessie in productie:** met welk e-mailadres logt zij in? Aanmaken met `npm run admin:create` tegen productie, en het wachtwoord veilig aan haar geven.
- [ ] **Privacyverklaring en algemene voorwaarden:** de inhoud aanleveren. Nodig vanwege persoonsgegevens en foto-uploads (AVG).

## Merk en beeld

- [ ] **Prijslijst-afbeelding** aanleveren, voor het kalibreren van de kleuren.
- [ ] **Foto's plaatsen** in het beheer onder Foto's: werk, voor en na, en de vaste plekken (shotcodes). Alleen met toestemming van herkenbare klanten.
- [ ] **Nieuwe fotografie** van Jessie en de salon (gepland deze week). Zie `PHOTO-SHOTLIST.md`.

## Techniek en infrastructuur

- [ ] **Melding bij een nieuw contactbericht** (Fase 13, e-mail): nu ziet Jessie nieuwe berichten alleen in het beheer, met een teller in het menu.

- [ ] **Vercel-plan:** het project staat in een Hobby-omgeving. Hobby is niet bedoeld voor commercieel gebruik, en cronjobs draaien daar hooguit één keer per dag. Vóór livegang: Pro-plan of externe cron voor de geplande taken (verlopen aanvragen, agenda-sync, opruimen van uploads).
- [ ] **Mailprovider** kiezen en de credentials instellen.
- [ ] **Nail-artfoto's van klanten** (privé uploads): Vercel Blob kan ook privé opslaan en is al gekoppeld. Nog te bouwen, samen met de bewaartermijn. Tot die tijd beschrijft de klant het ontwerp in tekst.
- [ ] **`BLOB_READ_WRITE_TOKEN` in Vercel als "sensitive" markeren** (Vercel meldt hem nu als leesbaar geheim).
- [ ] **Melding aan Jessie bij een nieuwe aanvraag:** volgt met de e-mail (Fase 13). Tot die tijd ziet ze aanvragen alleen in het beheer (Vandaag en Afspraken).
- [ ] **iCloud-spike draaien:** de spike staat klaar (`npm run spike:icloud`, zie `docs/icloud-spike.md`). Nodig: een test-Apple-ID met tweestapsverificatie en een app-specifiek wachtwoord, in `.env.icloud-spike`. Daarna de koppeling in het beheer bouwen (Jessie koppelt zelf, wachtwoord versleuteld in de database; zie `docs/besluiten.md`).
- [ ] **Domein** koppelen, en daarna `SITE_URL` instellen in Vercel (basis voor vrijgavelinks).
- [ ] **Klantberichten bij bevestigen, afwijzen, annuleren en verplaatsen:** volgen met de e-mail (Fase 13). Het beheer zegt Jessie nu dat ze de klant zelf moet inlichten.
- [ ] **Bij livegang:** `robots: noindex` in `src/app/layout.tsx` verwijderen.
