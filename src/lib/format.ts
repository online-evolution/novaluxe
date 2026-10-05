import { site } from "@/config/site";

const euroWhole = new Intl.NumberFormat(site.locale, {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const euroCents = new Intl.NumberFormat(site.locale, {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Bedragen worden als centen opgeslagen. Hele euro's tonen we zonder ",00"
 * (zoals in de prijslijst: "€ 1.000"), anders met centen ("€ 255,50").
 */
export function formatEuro(cents: number): string {
  const formatter = cents % 100 === 0 ? euroWhole : euroCents;
  return formatter.format(cents / 100);
}
