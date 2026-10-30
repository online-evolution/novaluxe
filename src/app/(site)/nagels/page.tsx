import type { Metadata, Route } from "next";
import { SitePhoto } from "@/components/media/site-photo";
import { NailProfile, type NailTreatment } from "@/components/nails/nail-profile";
import { PageClosing } from "@/components/page/page-closing";
import { PageLinks } from "@/components/page/page-links";
import { PageOpening } from "@/components/page/page-opening";
import { PageSection, SectionTitle } from "@/components/page/page-section";
import { PriceList, SetRefillTable } from "@/components/pricing/price-list";
import { BigLink } from "@/components/ui/action";
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

const chapters = [
  { id: "manicure", label: "Manicure en gellak" },
  { id: "biab", label: "BIAB" },
  { id: "acryl", label: "Acryl" },
  { id: "nail-art", label: "Nail art" },
  { id: "onderhoud", label: "Onderhoud" },
  { id: "tarieven", label: "Tarieven" },
];

type Comparison = {
  id: NailTreatment;
  title: string;
  text: string[];
  strength: string;
  length: string;
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
  },
];

const bySlug = (catalog: CatalogTreatment[], slug: string) =>
  catalog.find((treatment) => treatment.slug === slug);

/*
 * Teksten uit docs/bron (Nagels en Nagels tarieven); prijzen uit de database.
 * Foto's zijn optioneel: de pagina klopt ook zonder.
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
      <PageOpening
        id="nagels-titel"
        title="Mooie nagels beginnen bij de juiste behandeling"
        shot="N02"
        subject="Gellak in een mooie kleur"
      >
        <p className="mx-auto mt-6 max-w-measure text-lede">
          Hou je van kort en naturel, of juist van lange nagels met een opvallend design? Vertel me wat je mooi vindt.
        </p>
        <p className="mx-auto mt-4 max-w-measure">
          Bij NovaLuxe kun je terecht voor een manicure, gellak, BIAB of acryl. We kijken samen welke behandeling past bij
          jouw wensen en je natuurlijke nagels.
        </p>
        <div className="mt-8">
          <BigLink href={bookingHref}>Maak een nagelafspraak</BigLink>
        </div>
        <PageLinks items={chapters} />
      </PageOpening>

      {/* Vergelijking in doorsnede */}
      <section aria-label="Manicure, BIAB en acryl vergeleken" className="bg-cream px-gutter py-section-tight">
        <p className="max-w-measure text-small text-ink-soft">
          Doorsnede van een vingertop. De donkere lijn is je eigen nagel; het bronzen vlak is wat ik erop aanbreng.
        </p>
        <div className="mt-10 grid gap-x-10 gap-y-16 md:grid-cols-3">
          {comparisons.map((item) => (
            <article key={item.id} id={item.id} aria-labelledby={`${item.id}-titel`} className="scroll-mt-8">
              <NailProfile treatment={item.id} />
              <h2 id={`${item.id}-titel`} className="mt-8 text-display-s font-semibold text-balance">
                {item.title}
              </h2>
              {item.text.map((paragraph) => (
                <p key={paragraph} className="mt-5 max-w-measure">
                  {paragraph}
                </p>
              ))}
              <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-small">
                <dt className="text-ink-soft">Stevigheid</dt>
                <dd className="font-medium">{item.strength}</dd>
                <dt className="text-ink-soft">Lengte</dt>
                <dd className="font-medium">{item.length}</dd>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <PageSection
        id="nail-art"
        labelledBy="nail-art-titel"
        tone="ivory"
        shot="N06"
        subject="Nail art met details, zoals 3D-bloemen of glitter"
      >
        <SectionTitle id="nail-art-titel">Maak je set persoonlijk met nail art</SectionTitle>
        <p className="mt-8 max-w-measure text-lede">
          Een klassieke French, glitters, een speels design of 3D-bloemen: ik vind het leuk om van iedere set iets
          persoonlijks te maken. Je kunt nail art bijboeken bij gellak, BIAB en acryl.
        </p>
        <p className="mt-5 max-w-measure">
          Heb je ergens mooie nagels gezien of een voorbeeld opgeslagen? Laat het me vooraf zien, dan bespreken we wat
          mogelijk is.
        </p>
        {nailArt?.priceCents != null && (
          <p className="figures mt-6 text-lede font-semibold">Nail art: {formatEuro(nailArt.priceCents)} per nagel</p>
        )}
        <SitePhoto
          shot="W05"
          subject="Nail art in wording: penseel en details"
          className="mt-10 aspect-square w-1/2 sm:w-1/3"
          sizes="(min-width: 640px) 33vw, 50vw"
        />
      </PageSection>

      <PageSection
        labelledBy="zorg-titel"
        tone="bronze"
        shot="W04"
        subject="Product afweken in plaats van wegvijlen"
      >
        <h2 id="zorg-titel" className="max-w-[16em] text-display-m font-semibold text-balance">
          Ook je eigen nagels verdienen aandacht
        </h2>
        <p className="mt-8 max-w-measure text-lede">
          Ik werk zorgvuldig en houd rekening met de natuurlijke vorm van je nagels. Bij BIAB en acryl zorg ik voor een
          opbouw die de nagel goed ondersteunt.
        </p>
        <p className="mt-5 max-w-measure text-lede">
          Ook bij het verwijderen ben ik voorzichtig: ik week het product af in plaats van alles tot op de natuurlijke
          nagelplaat weg te vijlen. Zo probeer ik onnodige beschadiging te voorkomen.
        </p>
      </PageSection>

      <PageSection id="onderhoud" labelledBy="onderhoud-titel">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p aria-hidden="true" className="figures text-display-xl font-semibold">
              3
            </p>
            <p aria-hidden="true" className="mt-4 text-lede font-medium">
              weken, ongeveer, tussen twee afspraken
            </p>
          </div>
          <div>
            <SectionTitle id="onderhoud-titel">Onderhoud en reparatie</SectionTitle>
            <p className="mt-8 max-w-measure">
              Ik zie je graag ongeveer iedere drie weken terug om je nagels weer bij te werken. Wacht je langer, dan wordt
              de kans op breken of scheuren groter. Breekt er binnen de eerste week na je BIAB- of acrylbehandeling toch
              een nagel? Laat het me weten, dan repareer ik deze kosteloos.
            </p>
            <p className="mt-5 max-w-measure">
              Gebruik thuis regelmatig nagelriemolie en trek of knip velletjes niet zelf los. Zo help je jouw nagels en
              nagelriemen verzorgd te houden.
            </p>
          </div>
        </div>
      </PageSection>

      <PageSection id="tarieven" labelledBy="tarieven-titel" tone="ivory">
        <h2 id="tarieven-titel" className="text-display-l font-semibold text-balance">
          Nagels tarieven
        </h2>
        <div className="mt-12 grid gap-x-20 gap-y-14 lg:grid-cols-2">
          <div>
            <h3 className="text-display-s font-semibold">Manicure</h3>
            <div className="mt-5 text-lede">
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

      <PageClosing id="kiezen-titel" title="Hulp nodig bij het kiezen" href={bookingHref} label="Maak een nagelafspraak">
        Twijfel je over de juiste behandeling? Bel me gerust op{" "}
        <a href={site.phone.href} className="figures underline decoration-bronze underline-offset-4">
          {site.phone.display}
        </a>
        . Ik denk graag met je mee.
      </PageClosing>
    </>
  );
}
