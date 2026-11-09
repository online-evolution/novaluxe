"use client";

import { useState } from "react";
import { PriceList } from "@/components/pricing/price-list";
import { GoldSwitch } from "@/components/ui/gold-switch";
import type { PriceRow, SetRefillRow } from "@/domain/pricing";

type Mode = "new" | "refill";

/**
 * Prijzen nagels: vier gelijke lijsten met puntlijntjes, twee aan twee naast
 * elkaar. Naast de kopjes BIAB en acryl staat een gouden schakelaar voor nieuwe
 * set of opvullen; beide staan altijd in dezelfde stand. Alle kopjes zijn even
 * hoog, zodat de lijsten naast elkaar op dezelfde hoogte beginnen.
 */
export function NailPrices({
  title,
  manicure,
  biab,
  acryl,
  removal,
}: {
  title: React.ReactNode;
  manicure: PriceRow[];
  biab: SetRefillRow[];
  acryl: SetRefillRow[];
  removal: PriceRow[];
}) {
  const [mode, setMode] = useState<Mode>("new");
  const pick = (rows: SetRefillRow[]): PriceRow[] =>
    rows.map((row) => ({ label: row.label, priceCents: mode === "new" ? row.newSetCents : row.refillCents }));
  const modeSwitch = (legend: string) => (
    <GoldSwitch
      legend={legend}
      options={[
        { value: "new" as const, label: "Nieuwe set" },
        { value: "refill" as const, label: "Opvullen" },
      ]}
      value={mode}
      onChange={setMode}
    />
  );
  const modeLabel = mode === "new" ? "nieuwe set" : "opvullen";
  // Bij opvullen staat er soms geen prijs; de toelichting zegt dan waarom.
  const acrylNotes = mode === "refill" ? acryl.filter((row) => row.note).map((row) => `${row.label}: ${lower(row.note!)}`) : [];

  return (
    <>
      {title}

      <div className="mt-10 grid gap-x-20 gap-y-14 text-lede lg:grid-cols-2">
        <PriceBlock title="Manicure" rows={manicure} />
        <PriceBlock
          title="BIAB"
          rows={pick(biab)}
          caption={`Prijzen BIAB, ${modeLabel}`}
          live
          action={modeSwitch("Prijzen BIAB")}
        />
        {/* Op mobiel acryl direct na BIAB (de schakelaar geldt voor die twee); op desktop rechts onder BIAB. */}
        <PriceBlock
          title="Acryl"
          rows={pick(acryl)}
          caption={`Prijzen acryl, ${modeLabel}`}
          live
          action={modeSwitch("Prijzen acryl")}
          className="lg:col-start-2 lg:row-start-2"
        >
          {acrylNotes.length > 0 && <p className="mt-4 text-small text-ink-soft">{acrylNotes.join(" ")}</p>}
        </PriceBlock>
        <PriceBlock title="Verwijderen" rows={removal} className="lg:col-start-1 lg:row-start-2" />
      </div>
    </>
  );
}

function PriceBlock({
  title,
  rows,
  caption,
  live = false,
  className = "",
  action,
  children,
}: {
  title: string;
  rows: PriceRow[];
  caption?: string;
  live?: boolean;
  className?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h3 className="text-display-s font-semibold">{title}</h3>
        {action}
      </div>
      <div className="mt-5" aria-live={live ? "polite" : undefined}>
        <PriceList rows={rows} caption={caption ?? `Prijzen ${title.toLowerCase()}`} />
      </div>
      {children}
    </div>
  );
}

function lower(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}
