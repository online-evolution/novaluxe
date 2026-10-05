"use client";

import { useId, useState } from "react";
import type { PriceMatrix } from "@/domain/pricing";
import { formatEuro } from "@/lib/format";

/**
 * Prijzen nieuwe plaatsing. Op mobiel kies je eerst een lengte (vier korte
 * regels in plaats van een brede tabel); vanaf lg staat de volledige tabel.
 * Zonder JavaScript toont mobiel de eerste lengte.
 */
export function PlacementPrices({ matrix }: { matrix: PriceMatrix }) {
  const [selected, setSelected] = useState(matrix.lengths[0]);
  const groupName = useId();
  const selectedIndex = Math.max(0, matrix.lengths.indexOf(selected ?? NaN));

  if (matrix.lengths.length === 0) return null;

  return (
    <div>
      {/* Mobiel en tablet */}
      <div className="lg:hidden">
        <fieldset>
          <legend className="label text-ink-soft">Kies een lengte</legend>
          <div className="mt-3 grid grid-cols-4 border border-line-strong">
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
                <span className="figures flex h-12 cursor-pointer items-center justify-center border-l border-line-strong text-small font-medium transition-colors duration-(--duration-quick) peer-checked:bg-ink peer-checked:text-cream peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-bronze-deep [label:first-child_&]:border-l-0">
                  {length} cm
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <dl className="mt-4" aria-live="polite">
          {matrix.rows.map((row) => (
            <div
              key={row.weftRows}
              className="flex items-baseline justify-between gap-6 border-b border-line py-3"
            >
              <dt>{row.label}</dt>
              <dd className="figures text-display-s font-medium leading-none">
                {formatPrice(row.prices[selectedIndex])}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Desktop */}
      <table className="hidden w-full lg:table">
        <caption className="sr-only">Prijzen nieuwe plaatsing per lengte en aantal banen</caption>
        <thead>
          <tr className="border-b border-line-strong">
            <th scope="col" className="label py-3 text-left text-ink-soft">
              Aantal banen
            </th>
            {matrix.lengths.map((length) => (
              <th key={length} scope="col" className="label figures py-3 text-right text-ink-soft">
                {length} cm
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.rows.map((row) => (
            <tr key={row.weftRows} className="border-b border-line">
              <th scope="row" className="py-4 text-left font-normal">
                {row.label}
              </th>
              {row.prices.map((cents, index) => (
                <td key={matrix.lengths[index]} className="figures py-4 text-right text-lede">
                  {formatPrice(cents)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatPrice(cents: number | null | undefined): string {
  return cents === null || cents === undefined ? "—" : formatEuro(cents);
}
