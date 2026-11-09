"use client";

import { useId, useState } from "react";
import { DottedRow } from "@/components/page/dotted-row";
import { PriceList } from "@/components/pricing/price-list";
import type { PriceMatrix, PriceRow } from "@/domain/pricing";
import { formatEuro } from "@/lib/format";

/**
 * Prijzen extensions: nieuwe plaatsing en omhoogplaatsen naast elkaar. Bij
 * nieuwe plaatsing kies je eerst een lengte met een gouden schakelaar, zoals
 * die van voor en na; die staat op desktop in een eigen rij, zodat beide
 * lijsten op dezelfde hoogte beginnen. Zonder JavaScript staat de eerste
 * lengte er.
 */
export function PlacementPrices({ matrix, refresh }: { matrix: PriceMatrix; refresh: PriceRow[] }) {
  const [selected, setSelected] = useState(matrix.lengths[0]);
  const groupName = useId();
  const selectedIndex = Math.max(0, matrix.lengths.indexOf(selected ?? NaN));
  const count = matrix.lengths.length;

  return (
    <div className="grid text-lede lg:grid-cols-2 lg:gap-x-20">
      <h3 className="text-display-s font-semibold lg:col-start-1 lg:row-start-1">Nieuwe plaatsing</h3>
      {count > 0 && (
        <>
          <fieldset className="mt-5 lg:col-start-1 lg:row-start-2">
            <legend className="sr-only">Kies een lengte</legend>
            <div
              className="relative inline-grid rounded-full bg-ivory p-1 text-small font-semibold"
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
          <dl
            className="mt-6 lg:col-start-1 lg:row-start-3"
            aria-live="polite"
            aria-label={`Prijzen nieuwe plaatsing bij ${matrix.lengths[selectedIndex]} cm`}
          >
            {matrix.rows.map((row) => (
              <DottedRow key={row.weftRows} label={row.label} value={formatPrice(row.prices[selectedIndex])} />
            ))}
          </dl>
        </>
      )}

      <h3 className="mt-14 text-display-s font-semibold lg:col-start-2 lg:row-start-1 lg:mt-0">Omhoogplaatsen</h3>
      <div className="mt-6 lg:col-start-2 lg:row-start-3">
        <PriceList rows={refresh} caption="Prijzen omhoogplaatsen" />
      </div>
    </div>
  );
}

function formatPrice(cents: number | null | undefined): string {
  return cents === null || cents === undefined ? "—" : formatEuro(cents);
}
