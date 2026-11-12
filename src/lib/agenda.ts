/*
 * Kleine weergavehulpjes voor de agenda in het beheer. Puur, zodat ze te testen
 * zijn.
 */

/** "45 min", "1 uur", "1 uur 15 min". */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} uur` : `${hours} uur ${rest} min`;
}

/** Minuten tussen twee momenten. */
export function minutesBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 60_000);
}

/*
 * Jessie zet de tijd vaak vooraan in de titel ("11.00 Eveline", "1230 Jaimy").
 * In de lijst staat de tijd er al groot naast; die herhaling laten we weg. Alleen
 * iets wat echt een tijd is: "2 banen" of "10 nagels" blijven staan.
 */
const leadingTime = /^\s*(?:[01]?\d|2[0-3])(?:[.:][0-5]\d|[0-5]\d)(?:\s*u(?:ur)?\b)?[\s,:-]+/i;

export function busyTitle(title: string | null): string | null {
  if (!title) return null;
  const stripped = title.replace(leadingTime, "").trim();
  return stripped === "" ? title.trim() : stripped;
}
