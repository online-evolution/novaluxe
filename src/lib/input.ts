/* Invoer uit beheerformulieren controleren en omzetten. */

export type Parsed<T> = { ok: true; value: T } | { ok: false };

/** Minuten (5–600). Leeg = nog niet bekend (`null`). */
export function parseMinutesInput(input: string, { min = 5, max = 600 } = {}): Parsed<number | null> {
  const text = input.trim();
  if (text === "") return { ok: true, value: null };
  if (!/^\d+$/.test(text)) return { ok: false };
  const value = Number(text);
  return value >= min && value <= max ? { ok: true, value } : { ok: false };
}

/** Kloktijd "9:00" of "09:00" → "09:00". */
export function parseTimeInput(input: string): Parsed<string> {
  const match = /^(\d{1,2}):(\d{2})$/.exec(input.trim());
  if (!match) return { ok: false };
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return { ok: false };
  return { ok: true, value: `${String(hour).padStart(2, "0")}:${match[2]}` };
}

/** Datum "YYYY-MM-DD" (zoals een datumveld die levert) die echt bestaat. */
export function parseDateInput(input: string): Parsed<string> {
  const text = input.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return { ok: false };
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(text)
    ? { ok: true, value: text }
    : { ok: false };
}

/** Vrije tekst: ingekort en leeg → `null`. */
export function optionalText(input: FormDataEntryValue | null, maxLength = 500): string | null {
  const text = String(input ?? "").trim().slice(0, maxLength);
  return text === "" ? null : text;
}
