import type { Metadata, Route } from "next";
import { PlacementPrices } from "@/components/extensions/placement-prices";
import { WeftsDiagram } from "@/components/extensions/wefts-diagram";
import { PhotoPlaceholder } from "@/components/media/photo-placeholder";
import { PriceList } from "@/components/pricing/price-list";
import { PageIndex } from "@/components/site/page-index";
import { SectionHeading } from "@/components/site/section-heading";
import { ActionLink, actionClass } from "@/components/ui/action";
import { placementMatrix, priceRows } from "@/domain/pricing";
import { getTreatment } from "@/server/catalog";

export const metadata: Metadata = {
  title: "Extensions in Kijkduin",
  description:
    "Meer lengte en volume met een natuurlijke uitstraling. Genius Wefts met een invisible techniek in Kijkduin, Den Haag. We beginnen altijd met een gratis consult.",
};

const consultHref: Route = "/reserveren?behandeling=gratis-consult";

const chapters = [
  { id: "techniek", label: "Genius Wefts" },
  { id: "consult", label: "Gratis consult" },
  { id: "advies", label: "Eerlijk advies" },
  { id: "onderhoud", label: "Onderhoud" },
  { id: "tarieven", label: "Tarieven" },
  { id: "verzorging", label: "Verzorging" },
];

const careTips = [
  "Was je haar niet onnodig vaak en föhn het na het wassen goed droog.",
  "Gebruik hittebescherming wanneer je je haar met warmte stylet.",
  "Borstel bij voorkeur droog. Begin bij de punten en werk rustig naar boven.",
  "Verzorg de lengtes en punten dagelijks met een geschikte olie of een serum.",
  "Slaap met je haar vast, bij voorkeur op een satijnen kussensloop of met een bonnet.",
];

/*
 * Teksten uit docs/bron (Extensions en Extensions tarieven en verzorging);
 * prijzen uit de database.
 */
export default async function ExtensionsPage() {
  const [placement, refresh] = await Promise.all([
    getTreatment("nieuwe-plaatsing"),
    getTreatment("omhoogplaatsen"),
  ]);
  const matrix = placementMatrix(placement);
  const refreshRows = priceRows(refresh);

  return (
    <>
      {/* Opening */}
      <section aria-labelledby="extensions-titel" className="pt-section-tight">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-12">
          <div className="px-gutter lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:self-end lg:pl-0">
            <p className="label text-bronze-deep">Extensions</p>
            <h1 id="extensions-titel" className="mt-4 text-display-l font-medium text-balance">
              Meer lengte en volume met een natuurlijke uitstraling
            </h1>
          </div>
          <PhotoPlaceholder
            shot="E01"
            subject="Resultaat van achteren, natuurlijke val"
            className="aspect-[4/3] sm:aspect-[3/2] lg:col-span-5 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:aspect-[4/5]"
          />
          <div className="px-gutter lg:col-span-4 lg:col-start-8 lg:row-start-2 lg:pl-0">
            <p className="max-w-measure text-lede">
              Wil je langer haar, een vollere coupe of allebei? Vertel me wat je voor
              ogen hebt. Samen kijken we wat bij jouw haar past en hoe je het graag
              draagt.
            </p>
            <p className="mt-5 max-w-measure text-ink-soft">
              Ben je al blij met je lengte, maar mis je wat volume? Ook dan kunnen
              extensions een mooie aanvulling zijn.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
              <ActionLink href={consultHref}>Plan je gratis consult</ActionLink>
              <a href="#tarieven" className={actionClass("quiet")}>
                Bekijk de tarieven
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-section-tight">
        <PageIndex items={chapters} />
      </div>

      {/* 01 Techniek */}
      <section id="techniek" aria-labelledby="techniek-titel" className="mt-section scroll-mt-8 px-gutter">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <SectionHeading id="techniek-titel" number="01">
              Genius Wefts met een invisible techniek
            </SectionHeading>
            <p className="mt-8 max-w-measure text-lede">
              Ik werk voornamelijk met Genius Wefts: ultradunne, volle haarmatten. De
              ringetjes waarmee ik de extensions bevestig, werk ik tussen de wefts weg.
              Deze invisible techniek houdt de bevestigingen uit het zicht, zodat je je
              haar ook in een staart of opgestoken kunt dragen.
            </p>
            <p className="mt-5 max-w-measure text-ink-soft">
              Ik kijk naar jouw haar en stem daar de lengte, het gewicht en het aantal
              banen op af. Voor een mooie overgang naar je eigen haarkleur combineer ik
              waar nodig verschillende tinten extensions.
            </p>
          </div>
          <figure className="lg:col-span-4 lg:col-start-8">
            <WeftsDiagram lengthsCm={matrix.lengths} className="max-w-sm" />
            {/* TODO(content): uitleg "baan" laten bevestigen door Jessie (PROJECT-TODOS.md). */}
            <figcaption className="mt-4 max-w-sm text-small text-ink-soft">
              Eén baan is één rij wefts. Welke lengte en hoeveel banen bij jou passen,
              bespreken we tijdens het gratis consult.
            </figcaption>
          </figure>
        </div>
        <PhotoPlaceholder
          shot="E02"
          subject="Haar in een staart, bevestigingen niet zichtbaar"
          className="reveal mt-section-tight aspect-[3/2] lg:ml-[25%] lg:w-7/12"
        />
      </section>

      {/* 02 Consult */}
      <section id="consult" aria-labelledby="consult-titel" className="mt-section scroll-mt-8">
        <PhotoPlaceholder
          shot="J03"
          subject="Jessie in gesprek met een klant tijdens het consult"
          className="reveal aspect-[4/3] sm:aspect-[21/9]"
        />
        <div className="grid gap-10 px-gutter pt-12 lg:grid-cols-12 lg:gap-8">
          <SectionHeading id="consult-titel" number="02" className="lg:col-span-5">
            We beginnen met een gratis consult
          </SectionHeading>
          <div className="lg:col-span-6 lg:col-start-7">
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-8">
              <p>
                Tijdens het gratis consult nemen we rustig je wensen door en bekijk ik je
                haar. We kiezen samen de kleur en lengte en bespreken hoeveel haar je
                nodig hebt. Je hoort ook meteen wat het kost, zodat je vooraf weet waar
                je aan toe bent.
              </p>
              <p className="text-ink-soft">
                Ik heb haar op voorraad, maar bestel ook regelmatig speciaal voor een
                klant. Bestel ik haar voor jou? Dan betaal je na akkoord een aanbetaling
                voor die bestelling. We spreken samen af wanneer de extensions worden
                geplaatst.
              </p>
            </div>
            <div className="mt-10">
              <ActionLink href={consultHref}>Plan je gratis consult</ActionLink>
            </div>
          </div>
        </div>
      </section>

      {/* 03 Advies */}
      <section
        id="advies"
        aria-labelledby="advies-titel"
        className="mt-section scroll-mt-8 bg-ivory px-gutter py-section-tight"
      >
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <SectionHeading id="advies-titel" number="03" size="s" className="lg:col-span-3">
            Eerlijk advies over jouw haar
          </SectionHeading>
          <div className="lg:col-span-7 lg:col-start-5">
            <p className="text-display-s font-medium text-balance">
              Ik wil dat je blij bent met je extensions én dat je eigen haar in goede
              conditie blijft.
            </p>
            <p className="mt-6 max-w-measure text-ink-soft">
              Daarom kijk ik eerst goed of jouw haar de extensions kan dragen. Bij extreem
              dun of fijn haar, actief haarverlies of alopecia kan ik de behandeling
              afraden. Als iets niet verstandig is, vertel ik je dat eerlijk en kijken we
              samen wat wel mogelijk is.
            </p>
          </div>
        </div>
      </section>

      {/* 04 Onderhoud */}
      <section id="onderhoud" aria-labelledby="onderhoud-titel" className="mt-section scroll-mt-8 px-gutter">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <p aria-hidden="true" className="figures text-display-xl leading-none font-medium">
              6–8
            </p>
            <p aria-hidden="true" className="label mt-3 text-ink-soft">
              weken tussen twee keer omhoogplaatsen
            </p>
          </div>
          <div className="lg:col-span-6 lg:col-start-6 lg:pt-4">
            <SectionHeading id="onderhoud-titel" number="04">
              Onderhoud en omhoogplaatsen
            </SectionHeading>
            <p className="mt-8 max-w-measure">
              Iedere 6 tot 8 weken kom je terug om je extensions omhoog te laten
              plaatsen. Dan hoor ik ook graag hoe ze hebben gezeten. Heb je ergens last of
              irritatie gehad? Vertel het me, dan kijken we of de plaatsing aangepast moet
              worden.
            </p>
            <p className="mt-5 max-w-measure text-ink-soft">
              Bij het omhoogplaatsen gebruik ik dezelfde wefts opnieuw. Met de juiste
              verzorging gaat het haar doorgaans een jaar of langer mee. Hoe je het thuis
              verzorgt, maakt daarbij veel verschil.
            </p>
          </div>
        </div>
      </section>

      {/* 05 Tarieven */}
      <section id="tarieven" aria-labelledby="tarieven-titel" className="mt-section scroll-mt-8 px-gutter">
        <div className="grid gap-12 border-t border-line-strong pt-section-tight lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <SectionHeading id="tarieven-titel" number="05">
              Tarieven extensions
            </SectionHeading>
            <p className="mt-8 max-w-measure">
              Knippen, het laten overlopen van de extensions in je eigen haar en de
              styling zijn inbegrepen. Tijdens het gratis consult bespreken we welke
              lengte en hoeveel banen je nodig hebt.
            </p>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <h3 className="text-lede font-medium">Nieuwe plaatsing</h3>
            <div className="mt-5">
              <PlacementPrices matrix={matrix} />
            </div>

            <h3 className="mt-14 text-lede font-medium">Omhoogplaatsen</h3>
            <div className="mt-5">
              <PriceList rows={refreshRows} caption="Prijzen omhoogplaatsen" />
            </div>
          </div>
        </div>
      </section>

      {/* 06 Verzorging */}
      <section id="verzorging" aria-labelledby="verzorging-titel" className="mt-section scroll-mt-8 px-gutter">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6">
            <SectionHeading id="verzorging-titel" number="06">
              Zo verzorg je jouw extensions thuis
            </SectionHeading>
            <ol className="mt-10 border-t border-line">
              {careTips.map((tip, index) => (
                <li key={tip} className="flex items-baseline gap-5 border-b border-line py-4">
                  <span aria-hidden="true" className="label figures w-6 shrink-0 text-bronze-deep">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ol>
          </div>
          <aside aria-labelledby="zwemmen-titel" className="lg:col-span-4 lg:col-start-9">
            <PhotoPlaceholder
              shot="M05"
              subject="Borstel, satijnen kussensloop of bonnet"
              className="reveal aspect-square w-3/4 lg:w-full"
            />
            <h3 id="zwemmen-titel" className="mt-8 text-display-s font-medium">
              Zwemmen en zon
            </h3>
            <p className="mt-4 text-ink-soft">
              Bescherm je extensions extra tegen zout, chloor en zon. Maak het haar vóór
              het zwemmen nat met zoet water, gebruik geschikte bescherming en spoel het
              daarna direct goed uit. Voorkom vooral bij blonde extensions contact met
              zonnebrandcrème, omdat dit verkleuring kan veroorzaken.
            </p>
          </aside>
        </div>
      </section>

      {/* Afsluiting */}
      <section aria-labelledby="interesse-titel" className="mt-section px-gutter">
        <div className="grid gap-10 border-t border-line-strong pt-section-tight lg:grid-cols-12 lg:gap-8">
          <h2 id="interesse-titel" className="text-display-l font-medium text-balance lg:col-span-6">
            Interesse in extensions
          </h2>
          <div className="lg:col-span-5 lg:col-start-8 lg:pt-3">
            <p className="max-w-measure text-lede">
              Benieuwd of extensions iets voor jou zijn? Kom langs voor een gratis
              consult. Dan bekijk ik je haar en praten we over wat jij graag zou willen.
              Je krijgt eerlijk advies en weet meteen wat het kost.
            </p>
            <div className="mt-10">
              <ActionLink href={consultHref}>Plan je gratis consult</ActionLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
