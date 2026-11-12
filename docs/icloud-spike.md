# iCloud-spike (Fase 14)

Doel: vaststellen of NovaLuxe betrouwbaar met een iCloud-agenda kan werken, vóórdat er iets van in de app komt. Neon blijft de bron van waarheid; iCloud is alleen een synchronisatielaag (zie `docs/besluiten.md`, iCloud).

De spike staat los van de app, in `spike/icloud/`:

- `busy.ts` haalt uit agenda-data alleen begin, einde en bezet/vrij. Titel, beschrijving, locatie en deelnemers worden nooit gelezen. (Sinds 2026-11-12 leest de app ook de titel; zie docs/besluiten.md.) Herhalingen, uitzonderingen, tijdzones, "vrij" en geannuleerde afspraken worden zelf verwerkt (met ical.js), ook als de server dat niet doet.
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

Gebouwd op 9 november 2026 (zie `docs/besluiten.md`, iCloud). Daarvoor gold: daarna bouwen we de koppeling in het beheer: Jessie koppelt daar zelf haar Apple ID met een app-specifiek wachtwoord, versleuteld opgeslagen (zie `docs/besluiten.md`, iCloud). Haar echte agenda wordt eerst alleen gelezen.

## Resultaat

**9 november 2026, via het beheer, met een eigen Apple ID (niet van Jessie): geslaagd.** Alle onderdelen in orde:

| Onderdeel | Uitkomst | Tijd |
| --- | --- | --- |
| Inloggen | gelukt | 1,3 s |
| Agenda's vinden | 2 agenda's, beide met een wijzigingskenmerk | 0,5 s |
| Bezette tijden lezen | 0 tijdvakken (de agenda's waren leeg) | 0,5 s |
| Testagenda aanmaken | gelukt | 0,4 s |
| Testafspraken maken | gelukt | 2,1 s |
| Teruglezen en controleren | klopt: 4 bezette tijden en 1 hele dag; "vrij" telt niet mee; 1 uitzondering | 0,6 s |
| Versiekenmerk ophalen | gelukt | 0,3 s |
| Wijzigen met het juiste versiekenmerk | gelukt | 0,4 s |
| Wijzigen met een verouderd versiekenmerk | geweigerd (412) | 0,2 s |
| Wijziging opmerken | versiekenmerk van afspraak én agenda veranderd | 0,9 s |
| Opruimen | 4 verwijderd | 2,9 s |

Opmerkingen:

- Het lezen van bestaande afspraken is alleen bewezen met de eigen testafspraken. De agenda's van het testaccount waren leeg. Bij Jessies agenda eerst alleen lezen en de bezette tijden naast haar iPhone leggen.
- Een volledige ronde duurt ongeveer 10 seconden. Voor de koppeling lezen we daarom niet bij elke bezoeker, maar synchroniseren we op de achtergrond en houden we het resultaat kort vast.
- Nog te doen voor het criterium "drie keer achter elkaar": de test nog twee keer draaien.
