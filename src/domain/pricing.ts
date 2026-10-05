import type { CatalogTreatment } from "./catalog";

export type PriceMatrix = {
  /** Kolommen, bijvoorbeeld [30, 40, 50, 60] (cm). */
  lengths: number[];
  /** Rijen per aantal banen; `prices[i]` hoort bij `lengths[i]`. */
  rows: { weftRows: number; label: string; prices: (number | null)[] }[];
};

export type PriceRow = { label: string; priceCents: number | null };

const banen = (rows: number) => `${rows} ${rows === 1 ? "baan" : "banen"}`;

/** Prijstabel lengte × banen, zoals in de prijslijst (nieuwe plaatsing). */
export function placementMatrix(treatment: CatalogTreatment | undefined): PriceMatrix {
  const variants = (treatment?.variants ?? []).filter(
    (variant) => variant.lengthCm !== null && variant.weftRows !== null,
  );
  const lengths = [...new Set(variants.map((variant) => variant.lengthCm!))].sort((a, b) => a - b);
  const rowCounts = [...new Set(variants.map((variant) => variant.weftRows!))].sort((a, b) => a - b);

  return {
    lengths,
    rows: rowCounts.map((weftRows) => ({
      weftRows,
      label: banen(weftRows),
      prices: lengths.map(
        (length) =>
          variants.find((v) => v.lengthCm === length && v.weftRows === weftRows)?.priceCents ??
          null,
      ),
    })),
  };
}

export type SetRefillRow = {
  label: string;
  newSetCents: number | null;
  refillCents: number | null;
  /** Toelichting, bijvoorbeeld "Neem contact op voor opvullen." */
  note: string | null;
};

/** Tabel "nieuwe set / opvullen" per afwerking (BIAB, acryl), in Jessies volgorde. */
export function setRefillRows(treatment: CatalogTreatment | undefined): SetRefillRow[] {
  const rows = new Map<string, SetRefillRow>();
  for (const variant of treatment?.variants ?? []) {
    const row = rows.get(variant.label) ?? {
      label: variant.label,
      newSetCents: null,
      refillCents: null,
      note: null,
    };
    if (variant.kind === "new_set") row.newSetCents = variant.priceCents;
    if (variant.kind === "refill") row.refillCents = variant.priceCents;
    row.note ??= variant.note;
    rows.set(variant.label, row);
  }
  return [...rows.values()];
}

/** Eenvoudige lijst label → prijs, in de volgorde die Jessie heeft ingesteld. */
export function priceRows(treatment: CatalogTreatment | undefined): PriceRow[] {
  return (treatment?.variants ?? []).map((variant) => ({
    label: variant.label,
    priceCents: variant.priceCents,
  }));
}
