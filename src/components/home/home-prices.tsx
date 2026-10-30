import Link from "next/link";
import type { Route } from "next";
import type { CatalogTreatment } from "@/domain/catalog";
import { formatEuro } from "@/lib/format";
import { HomeButton } from "./home-button";

/** "Gratis", "€ 30" of "vanaf € 50"; `null` als er nog geen prijs bekend is. */
function priceText(treatment: CatalogTreatment | undefined): string | null {
  const prices = (treatment?.variants ?? [])
    .map((variant) => variant.priceCents)
    .filter((price): price is number => price !== null);
  if (prices.length === 0) return null;
  const lowest = Math.min(...prices);
  if (lowest === 0) return "Gratis";
  return lowest === Math.max(...prices) ? formatEuro(lowest) : `vanaf ${formatEuro(lowest)}`;
}

function PriceColumn({
  title,
  intro,
  note,
  href,
  linkLabel,
  slugs,
  catalog,
}: {
  title: string;
  intro: string;
  note?: string;
  href: Route;
  linkLabel: string;
  slugs: string[];
  catalog: CatalogTreatment[];
}) {
  const rows = slugs.flatMap((slug) => {
    const treatment = catalog.find((item) => item.slug === slug);
    const price = priceText(treatment);
    return treatment && price ? [{ name: treatment.name, price }] : [];
  });

  return (
    <div>
      <h3 className="text-display-s font-semibold">{title}</h3>
      <p className="mt-2">{intro}</p>
      <ul className="mt-5">
        {rows.map((row) => (
          <li key={row.name} className="flex items-baseline gap-2 py-2 text-lede font-medium">
            <span>{row.name}</span>
            <span aria-hidden="true" className="flex-1 -translate-y-1 border-b-2 border-dotted border-sand" />
            <span className="figures font-semibold whitespace-nowrap">{row.price}</span>
          </li>
        ))}
      </ul>
      {note && <p className="mt-3">{note}</p>}
      <Link href={href} className="mt-4 inline-block font-semibold underline underline-offset-4 hover:text-bronze-deep">
        {linkLabel}
      </Link>
    </div>
  );
}

/**
 * De prijskaart: zoals een kaart op de balie van de salon, met puntlijntjes
 * tussen behandeling en prijs. Geen foto's nodig; prijzen komen uit het beheer.
 */
export function HomePrices({ catalog }: { catalog: CatalogTreatment[] }) {
  const nailArt = catalog.flatMap((item) => item.options).find((option) => option.kind === "nail_art");

  return (
    <section aria-labelledby="home-prijzen" className="bg-cream px-gutter py-section-tight">
      <h2 id="home-prijzen" className="text-display-l font-semibold">
        De prijskaart
      </h2>
      <div className="mt-12 grid gap-14 lg:mt-16 lg:grid-cols-2 lg:gap-24">
        <PriceColumn
          title="Extensions"
          intro="Je begint altijd met een gratis consult."
          note="Knippen, blenden en styling zijn inbegrepen."
          href="/extensions"
          linkLabel="Alles over extensions"
          slugs={["gratis-consult", "nieuwe-plaatsing", "omhoogplaatsen"]}
          catalog={catalog}
        />
        <PriceColumn
          title="Nagels"
          intro={
            nailArt?.priceCents != null
              ? `Nail art kun je bijboeken voor ${formatEuro(nailArt.priceCents)} per nagel.`
              : "Nail art kun je bijboeken."
          }
          href="/nagels"
          linkLabel="Alles over nagels"
          slugs={["manicure-naturel", "manicure-gellak", "manicure-rubber-base", "biab", "acryl"]}
          catalog={catalog}
        />
      </div>
      <div className="mt-12">
        <HomeButton />
      </div>
    </section>
  );
}
