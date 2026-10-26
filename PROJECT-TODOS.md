# Openstaande punten

Alleen punten die nog echt open staan. Besluiten staan in `docs/besluiten.md`.

## Content en bedrijfsgegevens

- [ ] **Behandeltijden extensions:** nieuwe plaatsing en omhoogplaatsen (per 1–4 banen). Tot die tijd niet publiek boekbaar. Het gratis consult (15 minuten) is wel compleet.
- [ ] **Acryl babyboom/colourboom:** behandelduur van de nieuwe set. Tot die tijd incompleet en niet boekbaar.
- [ ] **"Verwijderen bij een nieuwe set: € 15 extra":** de uitleg moet bevestigd worden. Op dit moment opgevat als € 15 voor het verwijderen, náást de prijs van de nieuwe set. Niet als definitief tonen.
- [ ] **Uitleg "baan" bevestigen:** op /extensions staat bij het diagram "Eén baan is één rij wefts." Die zin staat niet in de bron; Jessie moet hem controleren.
- [ ] **Bewaartermijn** van voorbeeldfoto's voor nail art.
- [ ] **E-mailadres** van NovaLuxe: afzender, reply-to en het adres voor meldingen aan Jessie.
- [ ] **Beheerdersaccount voor Jessie in productie:** met welk e-mailadres logt zij in? Aanmaken met `npm run admin:create` tegen productie, en het wachtwoord veilig aan haar geven.
- [ ] **Privacyverklaring en algemene voorwaarden:** de inhoud aanleveren. Nodig vanwege persoonsgegevens en foto-uploads (AVG).

## Merk en beeld

- [ ] **Kleuren afstemmen op het logo:** het logo is helder goud (rond #F9C45C/#C2811F), de site gebruikt gedempt brons (#9a7854). Voorstel volgt; niets aangepast zonder akkoord.
- [ ] **Prijslijst-afbeelding** aanleveren, voor het kalibreren van de kleuren.
- [ ] **Bestaande foto's** van haar werk aanleveren.
- [ ] **Nieuwe fotografie** van Jessie en de salon (gepland deze week). Zie `PHOTO-SHOTLIST.md`.

## Techniek en infrastructuur

- [ ] **Vercel-plan:** het project staat in een Hobby-omgeving. Hobby is niet bedoeld voor commercieel gebruik, en cronjobs draaien daar hooguit één keer per dag. Vóór livegang: Pro-plan of externe cron voor de geplande taken (verlopen aanvragen, agenda-sync, opruimen van uploads).
- [ ] **Mailprovider** kiezen en de credentials instellen.
- [ ] **Storageprovider** kiezen voor de private uploads. Tot die tijd heeft de reserveringsflow geen veld voor een voorbeeldfoto bij nail art; de klant beschrijft het ontwerp in tekst.
- [ ] **Vrijgavelink voor een nieuwe extensionsplaatsing** (na het consult): het aanmaken in het beheer en de aanvraagroute met token. Hoort bij het afsprakenbeheer (Fase 11).
- [ ] **Melding aan Jessie bij een nieuwe aanvraag:** volgt met de e-mail (Fase 13). Tot die tijd ziet ze aanvragen alleen in het beheer (Fase 11).
- [ ] **iCloud:** een test-Apple-ID voor de spike, en daarna een app-specifiek wachtwoord voor de agenda van Jessie.
- [ ] **Domein** koppelen.
- [ ] **Bij livegang:** `robots: noindex` in `src/app/layout.tsx` verwijderen.
