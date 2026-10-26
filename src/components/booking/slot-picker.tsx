"use client";

import { useMemo, useState } from "react";
import { formatLongDate, utcToZonedParts } from "@/lib/time";

/*
 * Kalender met vrije dagen en daarnaast de vrije tijden van de gekozen dag.
 * Gebruikt in de reserveringsflow en op de vrijgavepagina voor extensions.
 * De vrije tijden komen altijd van de server.
 */

const weekdayHeads = ["ma", "di", "wo", "do", "vr", "za", "zo"];

const timeOf = (iso: string) => utcToZonedParts(new Date(iso)).time;

export type AvailableDay = { date: string; slots: string[] };

export function SlotPicker({
  days,
  date,
  start,
  onDate,
  onStart,
  notice,
  children,
}: {
  days: AvailableDay[];
  date: string | null;
  start: string | null;
  onDate: (date: string) => void;
  onStart: (start: string) => void;
  notice?: string;
  /** Onder de tijden, bijv. de knop naar de volgende stap. */
  children?: React.ReactNode;
}) {
  const availableDates = useMemo(() => new Set(days.map((day) => day.date)), [days]);
  const months = useMemo(() => monthsBetween(days[0]?.date, days.at(-1)?.date), [days]);
  const [monthIndex, setMonthIndex] = useState(0);
  const month = months[Math.min(monthIndex, months.length - 1)];
  const slots = days.find((day) => day.date === date)?.slots ?? [];

  return (
    <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10">
      {notice && (
        <p role="alert" className="form-message text-alert md:col-span-2">{notice}</p>
      )}
      <div>
        <div className="flex items-baseline justify-between">
          <p className="font-medium first-letter:uppercase" aria-live="polite">{month?.label}</p>
          <div className="flex gap-4 text-small">
            <button type="button" disabled={monthIndex === 0} onClick={() => setMonthIndex((i) => i - 1)} className="underline underline-offset-4 disabled:no-underline disabled:opacity-40">
              Vorige maand
            </button>
            <button type="button" disabled={monthIndex >= months.length - 1} onClick={() => setMonthIndex((i) => i + 1)} className="underline underline-offset-4 disabled:no-underline disabled:opacity-40">
              Volgende
            </button>
          </div>
        </div>
        {month && (
          <div aria-label={`Kalender ${month.label}`} className="figures mt-4 grid grid-cols-7 gap-1 text-center text-small">
            {weekdayHeads.map((head) => (
              <span key={head} aria-hidden="true" className="pb-1 text-ink-soft">{head}</span>
            ))}
            {month.cells.map((cell, index) =>
              cell === null ? (
                <span key={`leeg-${index}`} />
              ) : availableDates.has(cell) ? (
                <button
                  key={cell}
                  type="button"
                  aria-pressed={date === cell}
                  aria-label={formatLongDate(cell)}
                  onClick={() => onDate(cell)}
                  className={`h-11 font-medium transition-colors ${date === cell ? "bg-ink text-cream" : "border border-line-strong hover:border-ink"}`}
                >
                  {Number(cell.slice(8))}
                </button>
              ) : (
                <span key={cell} aria-hidden="true" className="flex h-11 items-center justify-center text-sand">
                  {Number(cell.slice(8))}
                </span>
              ),
            )}
          </div>
        )}
      </div>

      <div>
        {date ? (
          <fieldset>
            <legend className="font-medium first-letter:uppercase">{formatLongDate(date)}</legend>
            <div className="figures mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => (
                <label key={slot} className={`flex h-11 cursor-pointer items-center justify-center border text-small font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bronze-deep ${start === slot ? "border-ink bg-ink text-cream" : "border-line-strong hover:border-ink"}`}>
                  <input type="radio" name="tijd" value={slot} checked={start === slot} onChange={() => onStart(slot)} className="sr-only" />
                  {timeOf(slot)}
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <p className="text-ink-soft">Kies een dag in de kalender. Je ziet daarna welke tijden er voor jouw behandeling vrij zijn.</p>
        )}
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

/** Maanden (ma–zo) tussen twee datums, met lege vakjes vóór de eerste dag. */
function monthsBetween(first?: string, last?: string) {
  if (!first || !last) return [];
  const result: { label: string; cells: (string | null)[] }[] = [];
  let year = Number(first.slice(0, 4));
  let month = Number(first.slice(5, 7));
  const lastKey = last.slice(0, 7);
  const formatter = new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric", timeZone: "UTC" });
  for (;;) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const firstDay = new Date(Date.UTC(year, month - 1, 1));
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const offset = (firstDay.getUTCDay() + 6) % 7;
    const cells: (string | null)[] = Array.from({ length: offset }, () => null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(`${key}-${String(day).padStart(2, "0")}`);
    result.push({ label: formatter.format(firstDay), cells });
    if (key >= lastKey) break;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return result;
}
