import type { PriceRow } from "@/domain/pricing";
import { DottedRow } from "@/components/page/dotted-row";
import { formatEuro } from "@/lib/format";

const price = (cents: number | null) => (cents === null ? "—" : formatEuro(cents));

/** Eenvoudige lijst: behandeling links, prijs rechts, zoals op de prijskaart. */
export function PriceList({ rows, caption }: { rows: PriceRow[]; caption?: string }) {
  return (
    <dl aria-label={caption}>
      {rows.map((row) => (
        <DottedRow key={row.label} label={row.label} value={price(row.priceCents)} />
      ))}
    </dl>
  );
}

