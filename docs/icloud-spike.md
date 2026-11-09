# iCloud-spike (Fase 14)

Doel: vaststellen of NovaLuxe betrouwbaar met een iCloud-agenda kan werken, vóórdat er iets van in de app komt. Neon blijft de bron van waarheid; iCloud is alleen een synchronisatielaag (zie `docs/besluiten.md`, iCloud).

De spike staat los van de app, in `spike/icloud/`:

- `busy.ts` haalt uit agenda-data alleen begin, einde en bezet/vrij. Titel, beschrijving, locatie en deelnemers worden nooit gelezen. Herhalingen, uitzonderingen, tijdzones, "vrij" en geannuleerde afspraken worden zelf verwerkt (met ical.js), ook als de server dat niet doet.
- `checks.ts` voert alle controles uit tegen `caldav.icloud.com` (met tsdav). Het beheer (iCloud) en het script `run.ts` gebruiken allebei deze controles.
- `busy.test.ts` test zonder internet dat het lezen klopt, ook voor de eigen testafspraken van de spike: `npm run spike:icloud:test`.

## Zo draai je de spike

1. Gebruik een Apple ID dat niet van Jessie is, bijvoorbeeld je eigen.
2. Maak een app-specifiek wachtwoord op account.apple.com: Inloggen en beveiliging → App-specifieke wachtwoorden. Daarvoor moet tweestapsverificatie aan staan; bij de meeste Apple ID's is dat al zo.
3. Ga in het beheer naar **iCloud**, vul het Apple ID en de code in en klik op **Test de verbinding**. Na ongeveer een halve minuut zie je een lijst met vinkjes.

Er wordt niets opgeslagen: de gegevens bestaan alleen tijdens de test en komen nooit in een log of de database. Er zijn maximaal 10 tests per uur.

De spike maakt zijn eigen testafspraken in de agenda "NovaLuxe spike": een losse afspraak, een wekelijkse herhaling met één verplaatste en één geschrapte keer, een afspraak op "vrij" en een hele dag. Hij controleert ze en ruimt ze daarna op. Je hoeft zelf niets in de agenda te zetten.

Liever vanaf de opdrachtregel? Zet `ICLOUD_SPIKE_USERNAME` en `ICLOUD_SPIKE_APP_PASSWORD` in `.env.icloud-spike`. Dat bestand valt onder `.env*` en komt dus nooit in git. Draai dan:

```
npm run spike:icloud -- --rapport docs/icloud-spike-resultaat.md
```

## Wat de spike controleert

| Onderdeel | Wat we willen zien |
| --- | --- |
| Inloggen met een app-specifiek wachtwoord | Gelukt, binnen enkele seconden |
| Agenda's vinden | Alle agenda's met afspraken, met een wijzigingskenmerk (ctag of sync-token) |
| Bezette tijden lezen (30 dagen) | Alleen aantallen; niets van de inhoud |
| Eigen testafspraken teruglezen | Precies de verwachte bezette tijden: herhaling uitgerold, verplaatste keer op de nieuwe tijd, geschrapte keer weg, "vrij" telt niet mee, één hele dag |
| Wijzigen met het juiste versiekenmerk (If-Match) | Gelukt |
| Wijzigen met een verouderd versiekenmerk | Status 412: iCloud weigert, er wordt niets stil overschreven |
| Wijziging opmerken | Versiekenmerk van de afspraak én van de agenda veranderen |
| Opruimen | Alle testafspraken weer weg |

De spike schrijft alleen in de agenda "NovaLuxe spike". Die maakt hij zelf aan als hij nog niet bestaat, en hij laat hem daarna leeg staan.

## Beoordeling

**Door (koppeling bouwen in de app)** als:

- de test drie keer achter elkaar slaagt;
- de bezette tijden van de testafspraken kloppen;
- een verouderd versiekenmerk geweigerd wordt (412).

**Niet door** bij onverklaarbare fouten, onjuiste tijden, of als iCloud wijzigingen met een verouderd versiekenmerk accepteert. Dan rapporteren we eerst en kiezen we samen een alternatief, zoals een eenrichtings-ICS-abonnement vanuit NovaLuxe.

Daarna bouwen we de koppeling in het beheer: Jessie koppelt daar zelf haar Apple ID met een app-specifiek wachtwoord, versleuteld opgeslagen (zie `docs/besluiten.md`, iCloud). Haar echte agenda wordt eerst alleen gelezen.

## Resultaat

Nog niet gedraaid tegen een echt Apple ID.
