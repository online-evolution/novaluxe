import {
  isPubliclyBookable,
  optionsForVariant,
  type CatalogOption,
  type CatalogTreatment,
  type CatalogVariant,
} from "./catalog";

/*
 * Wat een aanvraag duurt en kost. Nail art heeft geen vaste prijs in het
 * totaal (€ 1 per nagel, Jessie stemt af); een onbevestigde meerprijs telt
 * ook niet mee en wordt als "volgt" getoond.
 */

export type BookingChoice = {
  treatment: CatalogTreatment;
  variant: CatalogVariant;
  options: CatalogOption[];
  nailArt: boolean;
};

export type Quote = {
  durationMinutes: number;
  /** Totaal van alle bekende, bevestigde prijzen. */
  priceCents: number;
  /** Onderdelen waarvan de prijs nog volgt (nail art, onbevestigde meerprijs). */
  openPrices: string[];
};

export function quote(choice: BookingChoice, nailArtBufferMinutes: number): Quote {
  let durationMinutes = choice.variant.durationMinutes ?? 0;
  let priceCents = choice.variant.priceCents ?? 0;
  const openPrices: string[] = [];

  for (const option of choice.options) {
    if (option.kind === "nail_art") continue;
    durationMinutes += option.durationMinutes ?? 0;
    if (option.priceConfirmed && option.priceCents !== null) priceCents += option.priceCents;
    else openPrices.push(option.name);
  }
  if (choice.nailArt) {
    durationMinutes += nailArtBufferMinutes;
    openPrices.push("Nail art");
  }
  return { durationMinutes, priceCents, openPrices };
}

export type ChoiceError =
  | "behandeling-niet-boekbaar"
  | "optie-niet-toegestaan"
  | "nail-art-niet-toegestaan";

/** Controleert een keuze tegen de catalogus (ook aan de serverkant). */
export function validateChoice(input: {
  treatment: CatalogTreatment;
  variant: CatalogVariant;
  optionIds: string[];
  nailArt: boolean;
}): { ok: true; choice: BookingChoice } | { ok: false; error: ChoiceError } {
  if (!isPubliclyBookable(input.treatment, input.variant)) {
    return { ok: false, error: "behandeling-niet-boekbaar" };
  }
  const allowed = optionsForVariant(input.treatment, input.variant);
  const chosen: CatalogOption[] = [];
  for (const id of new Set(input.optionIds)) {
    const option = allowed.find((item) => item.id === id && item.kind !== "nail_art");
    if (!option) return { ok: false, error: "optie-niet-toegestaan" };
    chosen.push(option);
  }
  if (input.nailArt && !allowed.some((item) => item.kind === "nail_art")) {
    return { ok: false, error: "nail-art-niet-toegestaan" };
  }
  return {
    ok: true,
    choice: { treatment: input.treatment, variant: input.variant, options: chosen, nailArt: input.nailArt },
  };
}
