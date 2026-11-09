# iCloud-spike (Fase 14)

Doel: vaststellen of NovaLuxe betrouwbaar met een iCloud-agenda kan werken, vóórdat er iets van in de app komt. Neon blijft de bron van waarheid; iCloud is alleen een synchronisatielaag (zie `docs/besluiten.md`, iCloud).

De spike staat los van de app, in `spike/icloud/`:

- `busy.ts` haalt uit agenda-data alleen begin, einde en bezet/vrij. Titel, beschrijving, locatie en deelnemers worden nooit gelezen. Herhalingen, uitzonderingen, tijdzones, "vrij" en geannuleerde afspraken worden zelf verwerkt (met ical.js), ook als de server dat niet doet.
- `busy.test.ts` test dat zonder internet: `npm run spike:icloud:test`.
- `run.ts` praat met `caldav.icloud.com` (met tsdav).

## Wat jij moet doen

1. **Maak een test-Apple-ID aan.** Niet het account van Jessie. Zet tweestapsverificatie aan; zonder die stap kun je geen app-specifiek wachtwoord maken.
2. **Maak een app-specifiek wachtwoord** op account.apple.com → Inloggen en beveiliging → App-specifieke wachtwoorden. Noem het bijvoorbeeld "NovaLuxe spike".
3. **Zet een paar testafspraken in de agenda van dat account**, zodat het lezen iets te doen heeft. Bijvoorbeeld via icloud.com of een iPhone met dat account:
   - een losse afspraak;
   - een wekelijkse herhaling, waarbij je één keer verplaatst en één keer verwijdert;
   - een afspraak die op "vrij" staat;
   - een afspraak voor de hele dag.
4. **Zet de gegevens in een bestand `.env.icloud-spike`** in de map van het project. Doe dit zelf, en zet het wachtwoord niet in de chat. Het bestand valt onder `.env*` en komt dus nooit in git.
   ```
   ICLOUD_SPIKE_USERNAME=<Apple ID van het testaccount>
   ICLOUD_SPIKE_APP_PASSWORD=<app-specifiek wachtwoord>
   ICLOUD_SPIKE_BEVESTIG=testaccount
   ```
5. **Draai de spike:**
   ```
   npm run spike:icloud -- --rapport docs/icloud-spike-resultaat.md
   ```
   Het rapport bevat alleen aantallen, tijden en statuscodes: geen inloggegevens en geen inhoud van afspraken. Het mag dus in git.

## Wat de spike controleert

| Onderdeel | Wat we willen zien |
| --- | --- |
| Inloggen met een app-specifiek wachtwoord | Gelukt, binnen enkele seconden |
| Agenda's vinden | Alle agenda's met afspraken, met een ctag of sync-token |
| Lezen over 30 dagen | Bezette tijdvakken kloppen met wat er in de agenda staat, inclusief herhalingen en uitzonderingen |
| Server-uitrol (expand) en free-busy-query | Ter informatie: we zijn er niet van afhankelijk, `busy.ts` rolt zelf uit |
| Schrijven in de agenda "NovaLuxe spike" | Aanmaken, teruglezen met ETag, wijzigen met If-Match en verwijderen lukken |
| Wijzigen met een verouderde ETag | Status 412: iCloud weigert, er wordt niets stil overschreven |
| Wijzigingen opmerken | ETag en ctag/sync-token veranderen na een wijziging |

De spike schrijft alleen in de agenda "NovaLuxe spike". Die maakt hij zelf aan als hij nog niet bestaat. Hij laat de agenda daarna staan; de testafspraak ruimt hij altijd op.

## Beoordeling

**Door (integratie bouwen in de app)** als:

- inloggen, lezen en schrijven betrouwbaar werken (drie keer achter elkaar draaien zonder fouten);
- de tijdvakken kloppen met de agenda op de iPhone;
- een verouderde ETag 412 geeft.

**Niet door** bij onverklaarbare fouten, onjuiste tijden, of als iCloud wijzigingen met een verouderde ETag accepteert. Dan rapporteren we eerst en kiezen we samen een alternatief, zoals een eenrichtings-ICS-abonnement vanuit NovaLuxe.

Pas daarna, en alleen in de modus `--alleen-lezen`, een controle op de echte agenda van Jessie, met een eigen app-specifiek wachtwoord dat zij kan intrekken.

Daarna bouwen we de koppeling in het beheer: Jessie koppelt daar zelf haar Apple ID met een app-specifiek wachtwoord, versleuteld opgeslagen (zie `docs/besluiten.md`, iCloud). Voor de spike zelf blijven de gegevens van het testaccount in `.env.icloud-spike`.

## Resultaat

Nog niet gedraaid: wacht op een test-Apple-ID. Het rapport komt in `docs/icloud-spike-resultaat.md`.
