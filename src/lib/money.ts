/*
 * Bedragen zoals Jessie ze typt ("30", "255,50", "€ 1.000") omzetten naar
 * centen, en terug naar invoertekst.
 */

export type ParsedAmount = { ok: true; cents: number | null } | { ok: false };

const maxCents = 100_000 * 100;

/** Leeg = nog geen prijs (`null`). Ongeldig = `{ ok: false }`. */
export function parseEuroInput(input: string): ParsedAmount {
  const text = input.replace(/€/g, "").replace(/\s/g, "");
  if (text === "") return { ok: true, cents: null };

  let normalised: string;
  if (text.includes(",")) {
    // Nederlandse notatie: punt = duizendtal, komma = decimaal.
    if (!/^\d{1,3}(\.\d{3})*,\d{1,2}$|^\d+,\d{1,2}$/.test(text)) return { ok: false };
    normalised = text.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    // "1.000" is duizend, geen één euro.
    normalised = text.replace(/\./g, "");
  } else if (/^\d+(\.\d{1,2})?$/.test(text)) {
    normalised = text;
  } else {
    return { ok: false };
  }

  const cents = Math.round(Number(normalised) * 100);
  if (!Number.isFinite(cents) || cents < 0 || cents > maxCents) return { ok: false };
  return { ok: true, cents };
}

/** Centen naar invoertekst: 25550 → "255,50", 3000 → "30". */
export function formatEuroInput(cents: number | null): string {
  if (cents === null) return "";
  const euros = Math.floor(cents / 100);
  const rest = cents % 100;
  return rest === 0 ? String(euros) : `${euros},${String(rest).padStart(2, "0")}`;
}
