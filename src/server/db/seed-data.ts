/*
 * Startgegevens uit de aangeleverde bron (docs/bron) en de briefing.
 *
 * De seed voegt alleen ontbrekende rijen toe en overschrijft nooit wat Jessie
 * in de admin heeft aangepast. `null` bij prijs of duur = nog niet aangeleverd:
 * die variant is incompleet en niet online boekbaar.
 */

type SeedVariant = {
  label: string;
  kind?: "standard" | "new_set" | "refill";
  lengthCm?: number;
  weftRows?: number;
  priceCents: number | null;
  durationMinutes: number | null;
  note?: string;
};

type SeedTreatment = {
  slug: string;
  category: "nails" | "extensions";
  name: string;
  publiclyBookable?: boolean;
  variants: SeedVariant[];
};

/** Nieuwe set en opvullen naast elkaar, zoals in de prijslijst. */
function setAndRefill(
  label: string,
  newSet: [price: number | null, minutes: number | null],
  refill: [price: number | null, minutes: number | null],
  refillNote?: string,
): SeedVariant[] {
  return [
    { label, kind: "new_set", priceCents: newSet[0], durationMinutes: newSet[1] },
    {
      label,
      kind: "refill",
      priceCents: refill[0],
      durationMinutes: refill[1],
      ...(refillNote ? { note: refillNote } : {}),
    },
  ];
}

const banen = (rows: number) => `${rows} ${rows === 1 ? "baan" : "banen"}`;

/** Prijzen nieuwe plaatsing per lengte, voor 1 t/m 4 banen. */
const placementPrices: Record<number, number[]> = {
  30: [25550, 40500, 55750, 71000],
  40: [26500, 43000, 59500, 76000],
  50: [29000, 48000, 67000, 86000],
  60: [32700, 55500, 78200, 100000],
};

export const seedTreatments: SeedTreatment[] = [
  // Nagels
  {
    slug: "manicure-naturel",
    category: "nails",
    name: "Manicure naturel",
    variants: [{ label: "Manicure naturel", priceCents: 3000, durationMinutes: 20 }],
  },
  {
    slug: "manicure-gellak",
    category: "nails",
    name: "Manicure met gellak",
    variants: [{ label: "Manicure met gellak", priceCents: 4000, durationMinutes: 30 }],
  },
  {
    slug: "manicure-rubber-base",
    category: "nails",
    name: "Manicure met rubber base",
    variants: [{ label: "Manicure met rubber base", priceCents: 4500, durationMinutes: 30 }],
  },
  {
    // De bron geeft per BIAB-afwerking één duur; die geldt voorlopig voor
    // nieuwe set én opvullen. Jessie kan ze apart aanpassen.
    slug: "biab",
    category: "nails",
    name: "BIAB",
    variants: [
      ...setAndRefill("BIAB naturel", [5000, 45], [5000, 45]),
      ...setAndRefill("BIAB met gellak", [5500, 50], [5500, 50]),
      ...setAndRefill("BIAB met French", [5500, 60], [5500, 60]),
      ...setAndRefill("BIAB mixed design", [6000, 60], [6000, 60]),
    ],
  },
  {
    slug: "acryl",
    category: "nails",
    name: "Acryl",
    variants: [
      ...setAndRefill("Acryl naturel", [6000, 60], [5000, 60]),
      ...setAndRefill("Acryl met gellak", [6500, 60], [5500, 60]),
      ...setAndRefill("Acryl met French", [7000, 75], [6000, 60]),
      // TODO(content): behandelduur nieuwe set babyboom/colourboom ontbreekt.
      ...setAndRefill(
        "Acryl met babyboom of colourboom",
        [7000, null],
        [null, null],
        "Neem contact op voor opvullen.",
      ),
      ...setAndRefill("Acryl mixed design", [7500, 90], [7000, 75]),
    ],
  },
  {
    slug: "product-verwijderen",
    category: "nails",
    name: "Product verwijderen",
    variants: [
      {
        label: "Rubber base of gellak verwijderen zonder nieuwe lak",
        priceCents: 1500,
        durationMinutes: 20,
      },
      { label: "BIAB verwijderen", priceCents: 2000, durationMinutes: 20 },
      { label: "Acryl verwijderen", priceCents: 2000, durationMinutes: 20 },
    ],
  },

  // Extensions. TODO(content): behandeltijden ontbreken nog; tot die tijd niet boekbaar.
  {
    slug: "gratis-consult",
    category: "extensions",
    name: "Gratis consult",
    variants: [{ label: "Gratis consult", priceCents: 0, durationMinutes: null }],
  },
  {
    slug: "omhoogplaatsen",
    category: "extensions",
    name: "Omhoogplaatsen",
    variants: [4000, 7000, 9000, 12000].map((priceCents, index) => ({
      label: banen(index + 1),
      weftRows: index + 1,
      priceCents,
      durationMinutes: null,
    })),
  },
  {
    slug: "nieuwe-plaatsing",
    category: "extensions",
    name: "Nieuwe plaatsing",
    // Alleen via een vrijgave van Jessie na het consult.
    publiclyBookable: false,
    variants: Object.entries(placementPrices).flatMap(([length, prices]) =>
      prices.map((priceCents, index) => ({
        label: `${length} cm · ${banen(index + 1)}`,
        lengthCm: Number(length),
        weftRows: index + 1,
        priceCents,
        durationMinutes: null,
      })),
    ),
  },
];

export const seedOptions = [
  {
    kind: "nail_art" as const,
    name: "Nail art",
    priceCents: 100, // per nagel
    priceConfirmed: true,
    durationMinutes: null, // uit de instelling nailArtDefaultBufferMinutes
    appliesTo: [
      { slug: "manicure-gellak", variantKind: null },
      { slug: "biab", variantKind: null },
      { slug: "acryl", variantKind: null },
    ],
  },
  {
    kind: "removal_before_new_set" as const,
    name: "Product verwijderen vóór je nieuwe set",
    priceCents: 1500,
    // TODO(content): uitleg "€ 15 extra" nog niet bevestigd (PROJECT-TODOS.md).
    priceConfirmed: false,
    durationMinutes: 20,
    appliesTo: [
      { slug: "biab", variantKind: "new_set" as const },
      { slug: "acryl", variantKind: "new_set" as const },
    ],
  },
];

/** Reguliere openingstijden (ISO-weekdag 1 = maandag). Zondag gesloten. */
export const seedBusinessHours = [
  { weekday: 1, opensAt: "09:00", closesAt: "18:00" },
  { weekday: 2, opensAt: "09:00", closesAt: "18:00" },
  { weekday: 3, opensAt: "09:00", closesAt: "18:00" },
  { weekday: 4, opensAt: "09:00", closesAt: "20:00" },
  { weekday: 5, opensAt: "09:00", closesAt: "18:00" },
  { weekday: 6, opensAt: "09:00", closesAt: "14:00" },
];
