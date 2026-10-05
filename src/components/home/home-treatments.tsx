import { PhotoPlaceholder } from "@/components/media/photo-placeholder";
import { ActionLink } from "@/components/ui/action";
import { lowestPriceCents, type CatalogTreatment } from "@/domain/catalog";
import { formatEuro } from "@/lib/format";

/**
 * Twee hoofdstukken naast elkaar met ongelijke beelden: extensions groot en
 * staand, nagels kleiner en verder naar beneden. Op mobiel loopt het eerste
 * beeld van rand tot rand en springt het tweede in.
 */
export function HomeTreatments({ catalog }: { catalog: CatalogTreatment[] }) {
  const placementFrom = lowestPriceCents(catalog, ["nieuwe-plaatsing"]);
  const nailPrices = [
    { label: "Manicure", cents: lowestPriceCents(catalog, ["manicure-naturel", "manicure-gellak", "manicure-rubber-base"]) },
    { label: "BIAB", cents: lowestPriceCents(catalog, ["biab"]) },
    { label: "Acryl", cents: lowestPriceCents(catalog, ["acryl"]) },
  ].filter((item): item is { label: string; cents: number } => item.cents !== null);

  return (
    <section aria-label="Behandelingen" className="mt-section grid gap-section-tight lg:grid-cols-12 lg:gap-8">
      <article aria-labelledby="home-extensions" className="lg:col-span-6">
        <PhotoPlaceholder
          shot="E01"
          subject="Extensions: resultaat van achteren, natuurlijke val"
          className="reveal aspect-[3/4]"
        />
        <div className="mt-8 px-gutter lg:pr-0">
          <p className="label text-bronze-deep">Extensions</p>
          <h2 id="home-extensions" className="mt-3 text-display-m font-medium text-balance">
            Haar dat bij jou past
          </h2>
          <p className="mt-6 max-w-measure text-ink-soft">
            Droom je van langer haar of mis je wat volume? Met extensions stem ik de
            lengte, kleur en hoeveelheid haar af op jouw wensen en je natuurlijke
            haar. Ik werk voornamelijk met ultradunne Genius Wefts, geplaatst met een
            invisible techniek. We beginnen altijd met een gratis consult om te kijken
            wat bij jou past.
          </p>
          <p className="figures mt-6 text-small">
            Gratis consult
            {placementFrom !== null && <> · plaatsing vanaf {formatEuro(placementFrom)}</>}
          </p>
          <div className="mt-8">
            <ActionLink variant="quiet" href="/extensions">
              Ontdek extensions
            </ActionLink>
          </div>
        </div>
      </article>

      <article aria-labelledby="home-nagels" className="lg:col-span-5 lg:col-start-8 lg:pt-[min(40vh,24rem)]">
        <PhotoPlaceholder
          shot="N03"
          subject="BIAB naturel of French op de eigen nagel"
          className="reveal ml-[18%] aspect-[4/5] lg:ml-0 lg:mr-gutter"
        />
        <div className="mt-8 px-gutter lg:pl-0">
          <p className="label text-bronze-deep">Nagels</p>
          <h2 id="home-nagels" className="mt-3 text-display-m font-medium text-balance">
            Jouw nagels in jouw stijl
          </h2>
          <p className="mt-6 max-w-measure text-ink-soft">
            Een verzorgde naturel look, een mooie kleur of een set met opvallende nail
            art. Bij NovaLuxe kun je terecht voor manicures, gellak, BIAB en acryl.
            Samen kiezen we een behandeling, vorm en afwerking die passen bij jouw
            nagels en de uitstraling die je zoekt.
          </p>
          {nailPrices.length > 0 && (
            <p className="figures mt-6 text-small">
              {nailPrices.map((item) => `${item.label} vanaf ${formatEuro(item.cents)}`).join(" · ")}
            </p>
          )}
          <div className="mt-8">
            <ActionLink variant="quiet" href="/nagels">
              Bekijk de nagelbehandelingen
            </ActionLink>
          </div>
        </div>
      </article>
    </section>
  );
}
