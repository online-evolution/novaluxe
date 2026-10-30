import type { Metadata, Route } from "next";
import { PlacementPrices } from "@/components/extensions/placement-prices";
import { WeftsDiagram } from "@/components/extensions/wefts-diagram";
import { SitePhoto } from "@/components/media/site-photo";
import { PageClosing } from "@/components/page/page-closing";
import { PageLinks } from "@/components/page/page-links";
import { PageOpening } from "@/components/page/page-opening";
import { PageSection, SectionTitle } from "@/components/page/page-section";
import { PriceList } from "@/components/pricing/price-list";
import { BigLink } from "@/components/ui/action";
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
 * prijzen uit de database. Foto's zijn optioneel: de pagina klopt ook zonder.
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
      <PageOpening
        id="extensions-titel"
        title="Meer lengte en volume met een natuurlijke uitstraling"
        shot="E01"
        subject="Resultaat van achteren, natuurlijke val"
      >
        <p className="mx-auto mt-6 max-w-measure text-lede">
          Wil je langer haar, een vollere coupe of allebei? Vertel me wat je voor ogen hebt. Samen kijken we wat bij jouw
          haar past en hoe je het graag draagt.
        </p>
        <p className="mx-auto mt-4 max-w-measure">
          Ben je al blij met je lengte, maar mis je wat volume? Ook dan kunnen extensions een mooie aanvulling zijn.
        </p>
        <div className="mt-8">
          <BigLink href={consultHref}>Plan je gratis consult</BigLink>
        </div>
        <PageLinks items={chapters} />
      </PageOpening>

      <section id="techniek" aria-labelledby="techniek-titel" className="scroll-mt-8 bg-cream px-gutter py-section-tight">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionTitle id="techniek-titel">Genius Wefts met een invisible techniek</SectionTitle>
            <p className="mt-8 max-w-measure text-lede">
              Ik werk voornamelijk met Genius Wefts: ultradunne, volle haarmatten. De ringetjes waarmee ik de extensions
              bevestig, werk ik tussen de wefts weg. Deze invisible techniek houdt de bevestigingen uit het zicht, zodat
              je je haar ook in een staart of opgestoken kunt dragen.
            </p>
            <p className="mt-5 max-w-measure">
              Ik kijk naar jouw haar en stem daar de lengte, het gewicht en het aantal banen op af. Voor een mooie
              overgang naar je eigen haarkleur combineer ik waar nodig verschillende tinten extensions.
            </p>
          </div>
          <figure className="mx-auto w-full max-w-md">
            <WeftsDiagram lengthsCm={matrix.lengths} />
            {/* TODO(content): uitleg "baan" laten bevestigen door Jessie (PROJECT-TODOS.md). */}
            <figcaption className="mt-4 text-small text-ink-soft">
              Eén baan is één rij wefts. Welke lengte en hoeveel banen bij jou passen, bespreken we tijdens het gratis
              consult.
            </figcaption>
          </figure>
        </div>
        <SitePhoto
          shot="E02"
          subject="Haar in een staart, bevestigingen niet zichtbaar"
          className="mx-auto mt-section-tight aspect-[4/5] w-3/4 sm:w-1/2 lg:w-1/3"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 75vw"
        />
      </section>

      <PageSection
        id="consult"
        labelledBy="consult-titel"
        tone="ivory"
        shot="J03"
        subject="Jessie in gesprek met een klant tijdens het consult"
      >
        <SectionTitle id="consult-titel">We beginnen met een gratis consult</SectionTitle>
        <div className="mt-8 grid max-w-4xl gap-5 lg:grid-cols-2 lg:gap-10">
          <p>
            Tijdens het gratis consult nemen we rustig je wensen door en bekijk ik je haar. We kiezen samen de kleur en
            lengte en bespreken hoeveel haar je nodig hebt. Je hoort ook meteen wat het kost, zodat je vooraf weet waar
            je aan toe bent.
          </p>
          <p>
            Ik heb haar op voorraad, maar bestel ook regelmatig speciaal voor een klant. Bestel ik haar voor jou? Dan
            betaal je na akkoord een aanbetaling voor die bestelling. We spreken samen af wanneer de extensions worden
            geplaatst.
          </p>
        </div>
        <div className="mt-8">
          <BigLink href={consultHref}>Plan je gratis consult</BigLink>
        </div>
      </PageSection>

      <PageSection id="advies" labelledBy="advies-titel" tone="bronze">
        <h2 id="advies-titel" className="text-lede font-semibold">
          Eerlijk advies over jouw haar
        </h2>
        <p className="statement mt-5 max-w-[19em] text-display-m font-medium text-pretty">
          Ik wil dat je blij bent met je extensions én dat je eigen haar in goede conditie blijft.
        </p>
        <p className="mt-8 max-w-measure text-lede">
          Daarom kijk ik eerst goed of jouw haar de extensions kan dragen. Bij extreem dun of fijn haar, actief
          haarverlies of alopecia kan ik de behandeling afraden. Als iets niet verstandig is, vertel ik je dat eerlijk en
          kijken we samen wat wel mogelijk is.
        </p>
      </PageSection>

      <PageSection id="onderhoud" labelledBy="onderhoud-titel">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p aria-hidden="true" className="figures text-display-xl font-semibold">
              6–8
            </p>
            <p aria-hidden="true" className="mt-4 text-lede font-medium">
              weken tussen twee keer omhoogplaatsen
            </p>
          </div>
          <div>
            <SectionTitle id="onderhoud-titel">Onderhoud en omhoogplaatsen</SectionTitle>
            <p className="mt-8 max-w-measure">
              Iedere 6 tot 8 weken kom je terug om je extensions omhoog te laten plaatsen. Dan hoor ik ook graag hoe ze
              hebben gezeten. Heb je ergens last of irritatie gehad? Vertel het me, dan kijken we of de plaatsing
              aangepast moet worden.
            </p>
            <p className="mt-5 max-w-measure">
              Bij het omhoogplaatsen gebruik ik dezelfde wefts opnieuw. Met de juiste verzorging gaat het haar doorgaans
              een jaar of langer mee. Hoe je het thuis verzorgt, maakt daarbij veel verschil.
            </p>
          </div>
        </div>
      </PageSection>

      <PageSection id="tarieven" labelledBy="tarieven-titel" tone="ivory">
        <h2 id="tarieven-titel" className="text-display-l font-semibold text-balance">
          Tarieven extensions
        </h2>
        <p className="mt-6 max-w-measure text-lede">
          Knippen, het laten overlopen van de extensions in je eigen haar en de styling zijn inbegrepen. Tijdens het
          gratis consult bespreken we welke lengte en hoeveel banen je nodig hebt.
        </p>
        <div className="mt-12 grid gap-14 lg:grid-cols-[3fr_2fr] lg:gap-20">
          <div>
            <h3 className="text-display-s font-semibold">Nieuwe plaatsing</h3>
            <div className="mt-5">
              <PlacementPrices matrix={matrix} />
            </div>
          </div>
          <div>
            <h3 className="text-display-s font-semibold">Omhoogplaatsen</h3>
            <div className="mt-5 text-lede">
              <PriceList rows={refreshRows} caption="Prijzen omhoogplaatsen" />
            </div>
          </div>
        </div>
      </PageSection>

      <section id="verzorging" aria-labelledby="verzorging-titel" className="scroll-mt-8 bg-cream px-gutter py-section-tight">
        <div className="grid gap-14 lg:grid-cols-[3fr_2fr] lg:gap-20">
          <div>
            <SectionTitle id="verzorging-titel">Zo verzorg je jouw extensions thuis</SectionTitle>
            <ul className="mt-8 grid gap-4 text-lede">
              {careTips.map((tip) => (
                <li key={tip} className="flex items-baseline gap-3">
                  <span aria-hidden="true" className="text-bronze">
                    ✦
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
          <aside aria-labelledby="zwemmen-titel">
            <SitePhoto
              shot="M05"
              subject="Borstel, satijnen kussensloop of bonnet"
              className="mb-8 aspect-square w-3/4 lg:w-full"
              sizes="(min-width: 1024px) 38vw, 75vw"
            />
            <h3 id="zwemmen-titel" className="text-display-s font-semibold">
              Zwemmen en zon
            </h3>
            <p className="mt-4">
              Bescherm je extensions extra tegen zout, chloor en zon. Maak het haar vóór het zwemmen nat met zoet water,
              gebruik geschikte bescherming en spoel het daarna direct goed uit. Voorkom vooral bij blonde extensions
              contact met zonnebrandcrème, omdat dit verkleuring kan veroorzaken.
            </p>
          </aside>
        </div>
      </section>

      <PageClosing id="interesse-titel" title="Interesse in extensions" href={consultHref} label="Plan je gratis consult">
        Benieuwd of extensions iets voor jou zijn? Kom langs voor een gratis consult. Dan bekijk ik je haar en praten we
        over wat jij graag zou willen. Je krijgt eerlijk advies en weet meteen wat het kost.
      </PageClosing>
    </>
  );
}
