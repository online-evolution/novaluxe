# NovaLuxe

Website en reserveringssysteem voor NovaLuxe, de salon voor extensions en nagels in Kijkduin.

**Stack:** Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4, Neon Postgres, Drizzle ORM en Vercel.

## Starten

```bash
npm install
cp .env.example .env.local   # vul de Neon-verbindingen in
npm run db:migrate           # schema bijwerken
npm run db:seed              # startgegevens (overschrijft nooit wijzigingen)
npm run dev
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
