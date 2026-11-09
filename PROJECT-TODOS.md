# Openstaande punten

Alleen punten die nog echt open staan. Besluiten staan in `docs/besluiten.md`.

## Content en bedrijfsgegevens

- [ ] **Behandeltijden extensions:** nieuwe plaatsing en omhoogplaatsen (per 1–4 banen). Tot die tijd niet publiek boekbaar. Het gratis consult (15 minuten) is wel compleet.
- [ ] **Acryl babyboom/colourboom:** behandelduur van de nieuwe set. Tot die tijd incompleet en niet boekbaar.
- [ ] **"Verwijderen bij een nieuwe set: € 15 extra":** de uitleg moet bevestigd worden. Op dit moment opgevat als € 15 voor het verwijderen, náást de prijs van de nieuwe set. Niet als definitief tonen.
- [ ] **Bewaartermijn** van voorbeeldfoto's voor nail art.
- [ ] **Bewaartermijn contactberichten:** berichten via het contactformulier blijven nu staan tot Jessie ze verwijdert (Beheer → Berichten). Termijn vaststellen en automatisch opruimen; vermelden in de privacyverklaring.
- [ ] **Gmail koppelen voor Jessie** (Beheer → E-mail): verificatie in 2 stappen aan, een app-wachtwoord "NovaLuxe" maken en koppelen. Afzender en antwoordadres zijn dan haar Gmail; meldingen gaan standaard naar hetzelfde adres (in te stellen).
- [ ] **Beheerdersaccount voor Jessie in productie:** met welk e-mailadres logt zij in? Aanmaken met `npm run admin:create` tegen productie, en het wachtwoord veilig aan haar geven.
- [ ] **Privacyverklaring en algemene voorwaarden:** de inhoud aanleveren. Nodig vanwege persoonsgegevens en foto-uploads (AVG).

## Merk en beeld

- [ ] **Prijslijst-afbeelding** aanleveren, voor het kalibreren van de kleuren.
- [ ] **Foto's plaatsen** in het beheer onder Foto's: werk, voor en na, en de vaste plekken (shotcodes). Alleen met toestemming van herkenbare klanten.
- [ ] **Nieuwe fotografie** van Jessie en de salon (gepland deze week). Zie `PHOTO-SHOTLIST.md`.

## Techniek en infrastructuur

- [ ] **Vercel-plan:** het project staat in een Hobby-omgeving. Hobby is niet bedoeld voor commercieel gebruik, en cronjobs draaien daar hooguit één keer per dag. Vóór livegang: Pro-plan of externe cron voor de geplande taken (verlopen aanvragen, agenda-sync, opruimen van uploads).
- [ ] **Nail-artfoto's van klanten** (privé uploads): Vercel Blob kan ook privé opslaan en is al gekoppeld. Nog te bouwen, samen met de bewaartermijn. Tot die tijd beschrijft de klant het ontwerp in tekst.
- [ ] **`BLOB_READ_WRITE_TOKEN` in Vercel als "sensitive" markeren** (Vercel meldt hem nu als leesbaar geheim).
- [ ] **iCloud koppelen voor Jessie:** de koppeling staat klaar (Beheer → iCloud). Jessie maakt een app-specifiek wachtwoord en koppelt zelf. Daarna samen controleren dat de bezette tijden kloppen met haar iPhone.
- [ ] **Optioneel, gratis: `CRON_SECRET` in Vercel zetten**, zodat alleen Vercel de dagelijkse agendataak kan starten. Zonder geheim kan iedereen hooguit één ronde per vijf minuten starten.
- [ ] **Domein** koppelen, en daarna `SITE_URL` instellen in Vercel (basis voor vrijgavelinks en links in mails).
- [ ] **Bij livegang:** `robots: noindex` in `src/app/layout.tsx` verwijderen.
