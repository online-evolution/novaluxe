export type OpeningRange = { opensAt: string; closesAt: string };
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type WeeklyHours = Record<Weekday, OpeningRange[]>;

const weekdays: Weekday[] = [1, 2, 3, 4, 5, 6, 7];
const shortNames: Record<Weekday, string> = {
  1: "ma",
  2: "di",
  3: "wo",
  4: "do",
  5: "vr",
  6: "za",
  7: "zo",
};

export type HoursLine = { days: string; hours: string };

const fullNames: Record<Weekday, string> = {
  1: "Maandag",
  2: "Dinsdag",
  3: "Woensdag",
  4: "Donderdag",
  5: "Vrijdag",
  6: "Zaterdag",
  7: "Zondag",
};

export function formatRanges(ranges: OpeningRange[]): string {
  return ranges.length === 0
    ? "Gesloten"
    : ranges.map((range) => `${range.opensAt}–${range.closesAt}`).join(", ");
}

/** Elke dag op een eigen regel, voor de contactpagina. */
export function weekdayRows(week: WeeklyHours): HoursLine[] {
  return weekdays.map((day) => ({ days: fullNames[day], hours: formatRanges(week[day]) }));
}

/** Afwijking op één datum, zonder Jessies interne notitie. */
export type DateException = {
  date: string; // YYYY-MM-DD, lokale datum
  closed: boolean;
  ranges: OpeningRange[];
};

/**
 * Vat de week samen tot leesbare regels, bijvoorbeeld:
 *   Ma–wo, vr   09:00–18:00
 *   Do          09:00–20:00
 *   Za          09:00–14:00
 *   Zo          gesloten
 * Dagen met dezelfde tijden worden samengevoegd; aaneengesloten dagen als reeks.
 */
export function summariseWeeklyHours(week: WeeklyHours): HoursLine[] {
  const groups = new Map<string, Weekday[]>();
  for (const day of weekdays) {
    const ranges = week[day];
    const key =
      ranges.length === 0
        ? "gesloten"
        : ranges.map((range) => `${range.opensAt}–${range.closesAt}`).join(", ");
    groups.set(key, [...(groups.get(key) ?? []), day]);
  }

  // Open dagen in weekvolgorde, gesloten dagen altijd als laatste regel.
  return [...groups.entries()]
    .sort(([a], [b]) => Number(a === "gesloten") - Number(b === "gesloten"))
    .map(([hours, days]) => ({
      days: capitalise(formatDayList(days)),
      hours,
    }));
}

function formatDayList(days: Weekday[]): string {
  const runs: Weekday[][] = [];
  for (const day of days) {
    const run = runs.at(-1);
    if (run && run.at(-1) === day - 1) run.push(day);
    else runs.push([day]);
  }
  return runs
    .map((run) =>
      run.length >= 3
        ? `${shortNames[run[0]!]}–${shortNames[run.at(-1)!]}`
        : run.map((day) => shortNames[day]).join(", "),
    )
    .join(", ");
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
