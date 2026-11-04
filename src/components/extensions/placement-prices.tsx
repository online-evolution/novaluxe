"use client";

import { useId, useState } from "react";
import { DottedRow } from "@/components/page/dotted-row";
import type { PriceMatrix } from "@/domain/pricing";
import { formatEuro } from "@/lib/format";

/**
 * Prijzen nieuwe plaatsing: eerst een lengte kiezen, dan vier rustige regels
 * in plaats van een tabel met zestien bedragen. De schakelaar is goud, zoals
 * die van voor en na. Zonder JavaScript staat de eerste lengte er.
 */
export function PlacementPrices({ title, matrix }: { title: React.ReactNode; matrix: PriceMatrix }) {
  const [selected, setSelected] = useState(matrix.lengths[0]);
  const groupName = useId();
  const selectedIndex = Math.max(0, matrix.lengths.indexOf(selected ?? NaN));
  const count = matrix.lengths.length;

  if (count === 0) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        {title}
        <fieldset>
          <legend className="sr-only">Kies een lengte</legend>
          <div
            className="relative grid rounded-full bg-ivory p-1 text-small font-semibold"
            style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-1 left-1 rounded-full bg-gold bg-(image:--gold-foil) transition-transform duration-500 ease-soft"
              style={{ width: `calc((100% - 0.5rem) / ${count})`, transform: `translateX(${selectedIndex * 100}%)` }}
            />
            {matrix.lengths.map((length) => (
              <label key={length} className="relative">
                <input
                  type="radio"
                  name={groupName}
                  value={length}
                  checked={length === selected}
                  onChange={() => setSelected(length)}
                  className="peer sr-only"
                />
                <span className="figures flex h-10 min-w-16 cursor-pointer items-center justify-center rounded-full px-3 whitespace-nowrap peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-bronze-deep">
                  {length} cm
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <dl className="mt-6 text-lede" aria-live="polite" aria-label={`Prijzen bij ${matrix.lengths[selectedIndex]} cm`}>
        {matrix.rows.map((row) => (
          <DottedRow key={row.weftRows} label={row.label} value={formatPrice(row.prices[selectedIndex])} />
        ))}
      </dl>
    </div>
  );
}

function formatPrice(cents: number | null | undefined): string {
  return cents === null || cents === undefined ? "—" : formatEuro(cents);
}
