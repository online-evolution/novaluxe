import type { Metadata, Route } from "next";
import { SitePhoto } from "@/components/media/site-photo";
import { NailProfile, type NailTreatment } from "@/components/nails/nail-profile";
import { Facts } from "@/components/page/facts";
import { PageOpening } from "@/components/page/page-opening";
import { PageSection, SectionTitle, SplitSection } from "@/components/page/page-section";
import { PhotoClosing } from "@/components/page/photo-closing";
import { PriceList, SetRefillTable } from "@/components/pricing/price-list";
import { site } from "@/config/site";
import type { CatalogTreatment } from "@/domain/catalog";
import { priceRows, setRefillRows, type PriceRow } from "@/domain/pricing";
import { formatEuro } from "@/lib/format";
import { getCatalog } from "@/server/catalog";

export const metadata: Metadata = {
  title: "Nagels in Kijkduin",
  description:
    "Manicure, gellak, BIAB en acryl in Kijkduin, Den Haag. Samen kiezen we een behandeling, vorm en afwerking die passen bij jouw nagels.",
};

const bookingHref: Route = "/reserveren?categorie=nagels";

type Comparison = {
  id: NailTreatment;
  title: string;
  text: string[];
  strength: string;
  length: string;
  shot: string;
  subject: string;
};

/* Teksten uit docs/bron; "stevigheid" en "lengte" zijn daaruit samengevat. */
const comparisons: Comparison[] = [
  {
    id: "manicure",
    title: "Manicure en gellak",
    text: [
      "Houd je van verzorgde, natuurlijke nagels? Kies dan voor een manicure naturel. Wil je er een mooie kleur bij die langer blijft zitten? Dan kun je kiezen voor gellak.",
      "Gellak kan ongeveer drie weken mooi blijven, maar geeft geen extra stevigheid aan je nagels. Je kunt ook een manicure met rubber base boeken.",
    ],
    strength: "Geen extra stevigheid",
    length: "Je eigen lengte",
    shot: "N02",
    subject: "Gellak in een mooie kleur",
  },
  {
    id: "biab",
    title: "BIAB voor je natuurlijke nagels",
    text: [
      "Wil je jouw eigen nagels verstevigen en laten groeien? BIAB geeft extra ondersteuning, waardoor ze minder snel breken.",
      "Ik gebruik BIAB alleen op de natuurlijke nagel. Wil je extra lengte? Dan adviseer ik acryl. Met BIAB kun je kiezen voor naturel, een kleur, French of een design dat jij mooi vindt.",
    ],
    strength: "Extra ondersteuning",
    length: "Je eigen lengte",
    shot: "N03",
    subject: "BIAB naturel of French op de eigen nagel",
  },
  {
    id: "acryl",
    title: "Acryl voor extra lengte en vorm",
    text: [
      "Met acryl kunnen we je nagels verlengen en heb je veel keuze in vorm en lengte. Weet je al precies wat je wilt? Leuk!",
      "Twijfel je nog, dan kijk ik met je mee naar wat mooi staat bij jouw handen. Daarna kiezen we de kleur of het design.",
    ],
    strength: "Opbouw die de nagel ondersteunt",
    length: "Verlengd, met keuze in vorm",
    shot: "N04",
    subject: "Acryl, lang, met een duidelijke vorm",
  },
];

const bySlug = (catalog: CatalogTreatment[], slug: string) =>
  catalog.find((treatment) => treatment.slug === slug);

/*
 * Teksten uit docs/bron (Nagels en Nagels tarieven); prijzen uit de database.
 * Foto's zijn optioneel: de pagina klopt ook zonder. Opbouw zoals Extensions:
 * een opening in brons met de salonfoto (S01), daarna om en om crème en ivoor
 * met de foto afwisselend rechts en links, en een afsluiter in brons.
 */
export default async function NailsPage() {
  const catalog = await getCatalog();
  const biab = bySlug(catalog, "biab");
  const acryl = bySlug(catalog, "acryl");
  const nailArt = catalog
    .flatMap((treatment) => treatment.options)
    .find((option) => option.kind === "nail_art");
  const removalBeforeSet = catalog
    .flatMap((treatment) => treatment.options)
    .find((option) => option.kind === "removal_before_new_set");

  const manicureRows: PriceRow[] = [
    ...["manicure-naturel", "manicure-gellak", "manicure-rubber-base"].flatMap((slug) =>
      priceRows(bySlug(catalog, slug)),
    ),
    ...(nailArt ? [{ label: "Nail art per nagel", priceCents: nailArt.priceCents }] : []),
  ];

  const removalRows: PriceRow[] = [
    ...priceRows(bySlug(catalog, "product-verwijderen")),
    // Onbevestigde prijzen tonen we niet als definitief (zie PROJECT-TODOS.md).
    ...(removalBeforeSet?.priceConfirmed && removalBeforeSet.priceCents !== null
      ? [{ label: "Verwijderen vóór een nieuwe set (extra)", priceCents: removalBeforeSet.priceCents }]
      : []),
  ];

  return (
    <>
      <PageOpening id="nagels-titel" title="Mooie nagels beginnen bij de juiste behandeling" backdrop="S01">
        <p className="mx-auto mt-6 max-w-measure text-lede">
          Hou je van kort en naturel, of juist van lange nagels met een opvallend design? Vertel me wat je mooi vindt.
        </p>
        <p className="mx-auto mt-4 max-w-measure text-lede">
          Bij NovaLuxe kun je terecht voor een manicure, gellak, BIAB of acryl. We kijken samen welke behandeling past bij
          jouw wensen en je natuurlijke nagels.
        </p>
      </PageOpening>

      {comparisons.map((item, index) => {
        const ivory = index % 2 === 1;
        return (
          <SplitSection
            key={item.id}
            id={item.id}
            labelledBy={`${item.id}-titel`}
            tone={ivory ? "ivory" : "cream"}
            shot={item.shot}
            subject={item.subject}
            photoFirst={ivory}
          >
            <SectionTitle id={`${item.id}-titel`}>{item.title}</SectionTitle>
            {item.text.map((paragraph, paragraphIndex) => (
              <p key={paragraph} className={`${paragraphIndex === 0 ? "mt-8" : "mt-5"} max-w-measure text-lede`}>
                {paragraph}
              </p>
            ))}
            <Facts
              panel={ivory ? "cream" : "ivory"}
              items={[
                { label: "Stevigheid", value: item.strength },
                { label: "Lengte", value: item.length },
              ]}
            />
            <figure className="mt-10 grid max-w-measure gap-4 sm:grid-cols-[16rem_1fr] sm:items-center sm:gap-6">
              <div className="w-64 max-w-full">
                <NailProfile treatment={item.id} />
              </div>
              <figcaption className="border-l border-gold pl-4 text-small text-ink-soft">
                Doorsnede van een vingertop. De donkere lijn is je eigen nagel; het bronzen vlak is wat ik erop aanbreng.
              </figcaption>
            </figure>
          </SplitSection>
        );
      })}

      <SplitSection
        id="nail-art"
        labelledBy="nail-art-titel"
        tone="ivory"
        shot="N06"
        subject="Nail art met details, zoals 3D-bloemen of glitter"
        photoFirst
      >
        <SectionTitle id="nail-art-titel">Maak je set persoonlijk met nail art</SectionTitle>
        <p className="mt-8 max-w-measure text-lede">
          Een klassieke French, glitters, een speels design of 3D-bloemen: ik vind het leuk om van iedere set iets
          persoonlijks te maken. Je kunt nail art bijboeken bij gellak, BIAB en acryl.
        </p>
        <p className="mt-5 max-w-measure text-lede">
          Heb je ergens mooie nagels gezien of een voorbeeld opgeslagen? Laat het me vooraf zien, dan bespreken we wat
          mogelijk is.
        </p>
        {nailArt?.priceCents != null && (
          <Facts items={[{ label: "Nail art", value: `${formatEuro(nailArt.priceCents)} per nagel` }]} />
        )}
        <SitePhoto
          shot="W05"
          subject="Nail art in wording: penseel en details"
          className="mt-10 aspect-square w-1/2 sm:w-1/3"
          sizes="(min-width: 640px) 33vw, 50vw"
        />
      </SplitSection>

      <SplitSection labelledBy="zorg-titel" shot="W04" subject="Product afweken in plaats van wegvijlen">
        <SectionTitle id="zorg-titel">Ook je eigen nagels verdienen aandacht</SectionTitle>
        <p className="mt-8 max-w-measure text-lede">
          Ik werk zorgvuldig en houd rekening met de natuurlijke vorm van je nagels. Bij BIAB en acryl zorg ik voor een
          opbouw die de nagel goed ondersteunt.
        </p>
        <p className="mt-5 max-w-measure text-lede">
          Ook bij het verwijderen ben ik voorzichtig: ik week het product af in plaats van alles tot op de natuurlijke
          nagelplaat weg te vijlen. Zo probeer ik onnodige beschadiging te voorkomen.
        </p>
      </SplitSection>

      <SplitSection
        id="onderhoud"
        labelledBy="onderhoud-titel"
        tone="ivory"
        shot="M04"
        subject="Nagelriemolie en verzorgingsproducten"
        photoFirst
      >
        <SectionTitle id="onderhoud-titel">Onderhoud en reparatie</SectionTitle>
        <p className="mt-8 max-w-measure text-lede">
          Ik zie je graag ongeveer iedere drie weken terug om je nagels weer bij te werken. Wacht je langer, dan wordt de
          kans op breken of scheuren groter. Breekt er binnen de eerste week na je BIAB- of acrylbehandeling toch een
          nagel? Laat het me weten, dan repareer ik deze kosteloos.
        </p>
        <p className="mt-5 max-w-measure text-lede">
          Gebruik thuis regelmatig nagelriemolie en trek of knip velletjes niet zelf los. Zo help je jouw nagels en
          nagelriemen verzorgd te houden.
        </p>
        <Facts
          items={[
            { label: "Bijwerken", value: "Ongeveer iedere 3 weken" },
            { label: "Breuk in de eerste week na BIAB of acryl", value: "Kosteloos gerepareerd" },
          ]}
        />
      </SplitSection>

      <PageSection id="tarieven" labelledBy="tarieven-titel" contained>
        <SectionTitle id="tarieven-titel">Nagels tarieven</SectionTitle>
        <div className="mt-12 grid gap-x-20 gap-y-14 text-lede lg:grid-cols-2">
          <div>
            <h3 className="text-display-s font-semibold">Manicure</h3>
            <div className="mt-5">
              <PriceList rows={manicureRows} caption="Prijzen manicure" />
            </div>
          </div>
          <div>
            <h3 className="text-display-s font-semibold">BIAB</h3>
            <div className="mt-5">
              <SetRefillTable rows={setRefillRows(biab)} caption="Prijzen BIAB" />
            </div>
          </div>
          <div>
            <h3 className="text-display-s font-semibold">Acryl</h3>
            <div className="mt-5">
              <SetRefillTable rows={setRefillRows(acryl)} caption="Prijzen acryl" />
            </div>
          </div>
          <div>
            <h3 className="text-display-s font-semibold">Verwijderen</h3>
            <div className="mt-5">
              <PriceList rows={removalRows} caption="Prijzen verwijderen" />
            </div>
            {nailArt?.priceCents != null && (
              <p className="mt-6 text-small text-ink-soft">
                Nail art kun je bijboeken bij gellak, BIAB en acryl:{" "}
                <span className="figures">{formatEuro(nailArt.priceCents)}</span> per nagel.
              </p>
            )}
          </div>
        </div>
      </PageSection>

      <PhotoClosing
        id="kiezen-titel"
        shot="S04"
        title="Hulp nodig bij het kiezen"
        href={bookingHref}
        label="Maak een nagelafspraak"
      >
        Twijfel je over de juiste behandeling? Bel me gerust op{" "}
        <a href={site.phone.href} className="figures underline decoration-gold underline-offset-4">
          {site.phone.display}
        </a>
        . Ik denk graag met je mee.
      </PhotoClosing>
    </>
  );
}
