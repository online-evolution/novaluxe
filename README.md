# NovaLuxe

Website en reserveringssysteem voor NovaLuxe, de salon voor extensions en nagels in Kijkduin.

**Stack:** Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4, Neon Postgres, Drizzle ORM en Vercel.

## Starten

```bash
npm install
cp .env.example .env.local   # Neon-branch "dev" invullen
npm run db:migrate           # schema bijwerken op dev
npm run db:seed              # startgegevens (overschrijft nooit wijzigingen)
npm run dev
```

Productie (Neon-branch `main`) staat lokaal in `.env.production.local` (zelfde variabelen). Die wordt gebruikt door `npm run build` en door:

```bash
npm run db:migrate:prod      # schema bijwerken op productie, vóór de deploy
```

## Beheerders

Er is geen openbare registratie. Een beheerder maak je aan met een gegenereerd wachtwoord, dat één keer wordt getoond:

```bash
npm run admin:create -- naam@voorbeeld.nl "Naam"
```

Gebruik `--reset` voor een nieuw wachtwoord bij een bestaand account. Dit werkt standaard op de dev-branch. Voor productie:

```bash
node --env-file=.env.production.local --import tsx scripts/create-admin.ts naam@voorbeeld.nl "Naam"
```

## Controles

```bash
npm run lint
npm run typecheck
npm run build
```

## Structuur

| Pad | Inhoud |
|---|---|
| `src/app` | Routes |
| `src/styles/tokens.css` | Design tokens: kleur, typografie, ritme, beweging |
| `src/components` | Merk-, media- en UI-componenten |
| `src/config/site.ts` | Vaste bedrijfsgegevens |
| `src/domain` | Pure businesslogica zonder database (instellingen, openingstijden, catalogusregels) |
| `src/server` | Server-only code: omgevingsvariabelen, database, gecachete data |
| `src/server/db/schema` | Drizzle-schema; migraties staan in `drizzle/` |
| `scripts/seed.ts` | Startgegevens: behandelingen, prijzen, duur, openingstijden, instellingen |
| `docs/bron` | Aangeleverde websiteteksten en goedgekeurde afwijkingen |
| `docs/besluiten.md` | Vastgestelde uitgangspunten |
| `PROJECT-TODOS.md` | Openstaande punten |
| `PHOTO-SHOTLIST.md` | Benodigde fotografie |
