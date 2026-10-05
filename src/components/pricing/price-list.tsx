import type { PriceRow, SetRefillRow } from "@/domain/pricing";
import { formatEuro } from "@/lib/format";

const price = (cents: number | null) => (cents === null ? "—" : formatEuro(cents));

/** Eenvoudige lijst: behandeling links, prijs rechts. */
export function PriceList({ rows, caption }: { rows: PriceRow[]; caption?: string }) {
  return (
    <dl aria-label={caption} className="border-t border-line-strong">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-baseline justify-between gap-6 border-b border-line py-3"
        >
          <dt>{row.label}</dt>
          <dd className="figures shrink-0">{price(row.priceCents)}</dd>
        </div>
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
          <tr className="border-b border-line-strong">
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
            <tr key={row.label} className="border-b border-line">
              <th scope="row" className="py-3 pr-3 text-left font-normal">
                {row.label}
              </th>
              <td className="figures py-3 text-right">{price(row.newSetCents)}</td>
              <td className="figures py-3 pl-4 text-right">{price(row.refillCents)}</td>
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
