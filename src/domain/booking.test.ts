import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { quote, validateChoice } from "./booking";
import type { CatalogOption, CatalogTreatment } from "./catalog";

const nailArt: CatalogOption = {
  id: "opt-nail-art",
  kind: "nail_art",
  name: "Nail art",
  priceCents: 100,
  priceConfirmed: true,
  durationMinutes: null,
  variantKind: null,
};
const removal: CatalogOption = {
  id: "opt-removal",
  kind: "removal_before_new_set",
  name: "Product verwijderen vóór je nieuwe set",
  priceCents: 1500,
  priceConfirmed: false,
  durationMinutes: 20,
  variantKind: "new_set",
};
const variant = (id: string, kind: "new_set" | "refill", price: number | null, minutes: number | null) => ({
  id,
  label: "BIAB met French",
  kind,
  lengthCm: null,
  weftRows: null,
  priceCents: price,
  durationMinutes: minutes,
  note: null,
  sortOrder: 0,
});
const biab: CatalogTreatment = {
  id: "t-biab",
  slug: "biab",
  category: "nails",
  name: "BIAB",
  summary: null,
  publiclyBookable: true,
  sortOrder: 0,
  variants: [variant("v-set", "new_set", 5500, 60), variant("v-refill", "refill", 5500, 60)],
  options: [nailArt, removal],
};

describe("validateChoice", () => {
  it("staat verwijderen alleen toe bij een nieuwe set", () => {
    assert.equal(validateChoice({ treatment: biab, variant: biab.variants[0]!, optionIds: ["opt-removal"], nailArt: false }).ok, true);
    const refill = validateChoice({ treatment: biab, variant: biab.variants[1]!, optionIds: ["opt-removal"], nailArt: false });
    assert.deepEqual(refill, { ok: false, error: "optie-niet-toegestaan" });
  });

  it("weigert een variant zonder duur (nog niet online te boeken)", () => {
    const incomplete = { ...biab, variants: [variant("v-x", "new_set", 5500, null)] };
    assert.deepEqual(validateChoice({ treatment: incomplete, variant: incomplete.variants[0]!, optionIds: [], nailArt: false }), {
      ok: false,
      error: "behandeling-niet-boekbaar",
    });
  });

  it("weigert nail art waar dat niet kan", () => {
    const manicure = { ...biab, slug: "manicure-naturel", options: [] };
    assert.deepEqual(validateChoice({ treatment: manicure, variant: manicure.variants[0]!, optionIds: [], nailArt: true }), {
      ok: false,
      error: "nail-art-niet-toegestaan",
    });
  });
});

describe("quote", () => {
  it("telt duur op, maar onbevestigde prijzen en nail art niet in het totaal", () => {
    const result = quote({ treatment: biab, variant: biab.variants[0]!, options: [removal], nailArt: true }, 15);
    assert.equal(result.durationMinutes, 60 + 20 + 15);
    assert.equal(result.priceCents, 5500);
    assert.deepEqual(result.openPrices, ["Product verwijderen vóór je nieuwe set", "Nail art"]);
  });

  it("telt een bevestigde meerprijs wel mee", () => {
    const confirmed = { ...removal, priceConfirmed: true };
    assert.equal(quote({ treatment: biab, variant: biab.variants[0]!, options: [confirmed], nailArt: false }, 15).priceCents, 7000);
  });
});
