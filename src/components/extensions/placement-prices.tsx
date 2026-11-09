"use client";

import { useState } from "react";
import { DottedRow } from "@/components/page/dotted-row";
import { PriceList } from "@/components/pricing/price-list";
import { GoldSwitch } from "@/components/ui/gold-switch";
import type { PriceMatrix, PriceRow } from "@/domain/pricing";
import { formatEuro } from "@/lib/format";

/**
 * Prijzen extensions: nieuwe plaatsing en omhoogplaatsen naast elkaar. Bij
 * nieuwe plaatsing kies je eerst een lengte; die schakelaar staat op desktop in
 * een eigen rij, zodat beide lijsten op dezelfde hoogte beginnen. Zonder
 * JavaScript staat de eerste lengte er.
 */
export function PlacementPrices({ matrix, refresh }: { matrix: PriceMatrix; refresh: PriceRow[] }) {
  const [selected, setSelected] = useState(matrix.lengths[0] ?? 0);
  const selectedIndex = Math.max(0, matrix.lengths.indexOf(selected));

  return (
    <div className="grid text-lede lg:grid-cols-2 lg:gap-x-20">
      <h3 className="text-display-s font-semibold lg:col-start-1 lg:row-start-1">Nieuwe plaatsing</h3>
      {matrix.lengths.length > 0 && (
        <>
          <div className="mt-5 lg:col-start-1 lg:row-start-2">
            <GoldSwitch
              legend="Kies een lengte"
              options={matrix.lengths.map((length) => ({ value: length, label: `${length} cm` }))}
              value={selected}
              onChange={setSelected}
            />
          </div>
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
