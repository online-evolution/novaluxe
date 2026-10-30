import type { PriceRow, SetRefillRow } from "@/domain/pricing";
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

/** Tabel met nieuwe set en opvullen naast elkaar, zoals in de prijslijst. */
export function SetRefillTable({ rows, caption }: { rows: SetRefillRow[]; caption: string }) {
  // Toelichting met de afwerking ervoor, zodat duidelijk is bij welke regel ze hoort.
  const notes = rows
    .filter((row) => row.note)
    .map((row) => `${row.label}: ${row.note!.charAt(0).toLowerCase()}${row.note!.slice(1)}`);
  return (
    <>
      <table className="w-full">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="label py-3 text-left text-ink-soft">
              Afwerking
            </th>
            <th scope="col" className="label py-3 text-right whitespace-nowrap text-ink-soft">
              Nieuwe set
            </th>
            <th scope="col" className="label py-3 pl-4 text-right whitespace-nowrap text-ink-soft">
              Opvullen
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b-2 border-dotted border-sand">
              <th scope="row" className="py-3 pr-3 text-left font-medium">
                {row.label}
              </th>
              <td className="figures py-3 text-right font-semibold">{price(row.newSetCents)}</td>
              <td className="figures py-3 pl-4 text-right font-semibold">{price(row.refillCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {notes.length > 0 && (
        <p className="mt-3 text-small text-ink-soft">{notes.join(" ")}</p>
      )}
    </>
  );
}
