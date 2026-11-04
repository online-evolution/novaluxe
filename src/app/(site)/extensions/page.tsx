import type { Metadata, Route } from "next";
import { PlacementPrices } from "@/components/extensions/placement-prices";
import { WeftsDiagram } from "@/components/extensions/wefts-diagram";
import { PageOpening } from "@/components/page/page-opening";
import { PageSection, SectionTitle, SplitSection } from "@/components/page/page-section";
import { PhotoClosing } from "@/components/page/photo-closing";
import { PriceList } from "@/components/pricing/price-list";
import { BigLink } from "@/components/ui/action";
import { placementMatrix, priceRows } from "@/domain/pricing";
import { scriptFont } from "@/lib/fonts";
import { getTreatment } from "@/server/catalog";

export const metadata: Metadata = {
  title: "Extensions in Kijkduin",
  description:
    "Meer lengte en volume met een natuurlijke uitstraling. Genius Wefts met een invisible techniek in Kijkduin, Den Haag. We beginnen altijd met een gratis consult.",
};

const consultHref: Route = "/reserveren?behandeling=gratis-consult";

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
 * Opbouw zoals de homepage: ivoor, dan om en om crème en ivoor met de foto
 * afwisselend rechts en links, en tot slot brons. Alle lopende tekst in
 * text-lede.
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
        <p className="mx-auto mt-4 max-w-measure text-lede">
          Ben je al blij met je lengte, maar mis je wat volume? Ook dan kunnen extensions een mooie aanvulling zijn.
        </p>
        <div className="mt-8">
          <BigLink href={consultHref}>Plan je gratis consult</BigLink>
        </div>
      </PageOpening>

      <SplitSection
        id="consult"
        labelledBy="consult-titel"
        shot="J03"
        subject="Jessie in gesprek met een klant tijdens het consult"
      >
        <SectionTitle id="consult-titel">We beginnen met een gratis consult</SectionTitle>
        <p className="mt-8 max-w-measure text-lede">
          Tijdens het gratis consult nemen we rustig je wensen door en bekijk ik je haar. We kiezen samen de kleur en
          lengte en bespreken hoeveel haar je nodig hebt. Je hoort ook meteen wat het kost, zodat je vooraf weet waar je
          aan toe bent.
        </p>
        <p className="mt-5 max-w-measure text-lede">
          Ik heb haar op voorraad, maar bestel ook regelmatig speciaal voor een klant. Bestel ik haar voor jou? Dan betaal
          je na akkoord een aanbetaling voor die bestelling. We spreken samen af wanneer de extensions worden geplaatst.
        </p>
        <BigLink href={consultHref} size="md" className="mt-8">
          Plan je gratis consult
        </BigLink>
      </SplitSection>

      <SplitSection
        id="techniek"
        labelledBy="techniek-titel"
        tone="ivory"
        shot="E02"
        subject="Haar in een staart, bevestigingen niet zichtbaar"
        photoFirst
      >
        <SectionTitle id="techniek-titel">Genius Wefts met een invisible techniek</SectionTitle>
        <p className="mt-8 max-w-measure text-lede">
          Ik werk voornamelijk met Genius Wefts: ultradunne, volle haarmatten. De ringetjes waarmee ik de extensions
          bevestig, werk ik tussen de wefts weg. Deze invisible techniek houdt de bevestigingen uit het zicht, zodat je je
          haar ook in een staart of opgestoken kunt dragen.
        </p>
        <p className="mt-5 max-w-measure text-lede">
          Ik kijk naar jouw haar en stem daar de lengte, het gewicht en het aantal banen op af. Voor een mooie overgang
          naar je eigen haarkleur combineer ik waar nodig verschillende tinten extensions.
        </p>
        <figure className="mt-10 flex max-w-measure items-end gap-6">
          <WeftsDiagram lengthsCm={matrix.lengths} className="w-32 shrink-0 sm:w-40" />
          {/* TODO(content): uitleg "baan" laten bevestigen door Jessie (PROJECT-TODOS.md). */}
          <figcaption className="border-l border-gold pl-4 text-small text-ink-soft">
            Eén baan is één rij wefts. Welke lengte en hoeveel banen bij jou passen, bespreken we tijdens het gratis
            consult.
          </figcaption>
        </figure>
      </SplitSection>

      <SplitSection id="advies" labelledBy="advies-titel" shot="W03" subject="Jessie bekijkt het haar van een klant">
        <SectionTitle id="advies-titel">Eerlijk advies over jouw haar</SectionTitle>
        <blockquote
          className={`${scriptFont.className} mt-8 max-w-[30em] border-l-2 border-gold pl-5 text-[clamp(1.85rem,1.5rem+1.3vw,2.5rem)] leading-tight text-pretty`}
        >
          Ik wil dat je blij bent met je extensions én dat je eigen haar in goede conditie blijft.
        </blockquote>
        <p className="mt-8 max-w-measure text-lede">
          Daarom kijk ik eerst goed of jouw haar de extensions kan dragen. Bij extreem dun of fijn haar, actief
          haarverlies of alopecia kan ik de behandeling afraden. Als iets niet verstandig is, vertel ik je dat eerlijk en
          kijken we samen wat wel mogelijk is.
        </p>
      </SplitSection>

      <SplitSection
        id="onderhoud"
        labelledBy="onderhoud-titel"
        tone="ivory"
        shot="W02"
        subject="Handen van Jessie die een weft omhoogplaatsen"
        photoFirst
      >
        <SectionTitle id="onderhoud-titel">Onderhoud en omhoogplaatsen</SectionTitle>
        <p className="mt-8 max-w-measure text-lede">
          Iedere 6 tot 8 weken kom je terug om je extensions omhoog te laten plaatsen. Dan hoor ik ook graag hoe ze hebben
          gezeten. Heb je ergens last of irritatie gehad? Vertel het me, dan kijken we of de plaatsing aangepast moet
          worden.
        </p>
        <p className="mt-5 max-w-measure text-lede">
          Bij het omhoogplaatsen gebruik ik dezelfde wefts opnieuw. Met de juiste verzorging gaat het haar doorgaans een
          jaar of langer mee. Hoe je het thuis verzorgt, maakt daarbij veel verschil.
        </p>
        <dl className="mt-10 grid max-w-measure gap-6 sm:grid-cols-2">
          <div className="bg-cream px-6 py-5">
            <dt className="text-small font-medium text-ink-soft">Omhoogplaatsen</dt>
            <dd className="figures mt-1 text-display-s font-semibold">Iedere 6–8 weken</dd>
          </div>
          <div className="bg-cream px-6 py-5">
            <dt className="text-small font-medium text-ink-soft">Dezelfde wefts</dt>
            <dd className="mt-1 text-display-s font-semibold">Een jaar of langer</dd>
          </div>
        </dl>
      </SplitSection>

      <PageSection id="tarieven" labelledBy="tarieven-titel" contained>
        <SectionTitle id="tarieven-titel">Tarieven extensions</SectionTitle>
        <p className="mt-8 max-w-measure text-lede">
          Knippen, het laten overlopen van de extensions in je eigen haar en de styling zijn inbegrepen. Tijdens het
          gratis consult bespreken we welke lengte en hoeveel banen je nodig hebt.
        </p>
        <div className="mt-14 grid gap-14 lg:grid-cols-2 lg:gap-20">
          <PlacementPrices matrix={matrix} title={<h3 className="text-display-s font-semibold">Nieuwe plaatsing</h3>} />
          <div>
            {/* Even hoog als de kop met de lengteschakelaar, zodat de regels gelijk beginnen. */}
            <div className="flex min-h-12 items-center">
              <h3 className="text-display-s font-semibold">Omhoogplaatsen</h3>
            </div>
            <div className="mt-6 text-lede">
              <PriceList rows={refreshRows} caption="Prijzen omhoogplaatsen" />
            </div>
          </div>
        </div>
      </PageSection>

      <SplitSection
        id="verzorging"
        labelledBy="verzorging-titel"
        tone="ivory"
        shot="M05"
        subject="Borstel, satijnen kussensloop of bonnet"
        square
      >
        <SectionTitle id="verzorging-titel">Zo verzorg je jouw extensions thuis</SectionTitle>
        <ul className="mt-8 grid max-w-measure gap-4 text-lede">
          {careTips.map((tip) => (
            <li key={tip} className="flex items-baseline gap-4">
              <span aria-hidden="true" className="text-gold">
                ✦
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
        <aside
          aria-labelledby="zwemmen-titel"
          className="mt-10 max-w-measure bg-cream p-8 outline-[1.5px] outline-offset-6 outline-gold outline-solid"
        >
          <h3 id="zwemmen-titel" className="text-display-s font-semibold">
            Zwemmen en zon
          </h3>
          <p className="mt-4 text-lede">
            Bescherm je extensions extra tegen zout, chloor en zon. Maak het haar vóór het zwemmen nat met zoet water,
            gebruik geschikte bescherming en spoel het daarna direct goed uit. Voorkom vooral bij blonde extensions
            contact met zonnebrandcrème, omdat dit verkleuring kan veroorzaken.
          </p>
        </aside>
      </SplitSection>

      <PhotoClosing
        id="interesse-titel"
        shot="S01"
        title="Interesse in extensions"
        href={consultHref}
        label="Plan je gratis consult"
      >
        Benieuwd of extensions iets voor jou zijn? Kom langs voor een gratis consult. Dan bekijk ik je haar en praten we
        over wat jij graag zou willen. Je krijgt eerlijk advies en weet meteen wat het kost.
      </PhotoClosing>
    </>
  );
}
