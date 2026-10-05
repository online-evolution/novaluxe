import type { Metadata, Route } from "next";
import { PhotoPlaceholder } from "@/components/media/photo-placeholder";
import { NailProfile, type NailTreatment } from "@/components/nails/nail-profile";
import { PriceList, SetRefillTable } from "@/components/pricing/price-list";
import { PageIndex } from "@/components/site/page-index";
import { SectionHeading } from "@/components/site/section-heading";
import { ActionLink, actionClass } from "@/components/ui/action";
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
  number: string;
  title: string;
  text: string[];
  strength: string;
  length: string;
};

/* Teksten uit docs/bron; "stevigheid" en "lengte" zijn daaruit samengevat. */
const comparisons: Comparison[] = [
  {
    id: "manicure",
    number: "01",
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
    number: "02",
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
    number: "03",
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
      {/* Opening */}
      <section aria-labelledby="nagels-titel" className="px-gutter pt-section-tight">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-8">
            <p className="label text-bronze-deep">Nagels</p>
            <h1 id="nagels-titel" className="mt-4 text-display-l font-medium text-balance">
              Mooie nagels beginnen bij de juiste behandeling
            </h1>
            <div className="mt-10 lg:ml-[25%]">
              <p className="max-w-measure text-lede">
                Hou je van kort en naturel, of juist van lange nagels met een opvallend
                design? Vertel me wat je mooi vindt.
              </p>
              <p className="mt-5 max-w-measure text-ink-soft">
                Bij NovaLuxe kun je terecht voor een manicure, gellak, BIAB of acryl. We
                kijken samen welke behandeling past bij jouw wensen en je natuurlijke
                nagels.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
                <ActionLink href={bookingHref}>Maak een nagelafspraak</ActionLink>
                <a href="#tarieven" className={actionClass("quiet")}>
                  Bekijk de tarieven
                </a>
              </div>
            </div>
          </div>
          <PhotoPlaceholder
            shot="N02"
            subject="Gellak in een mooie kleur"
            className="aspect-[4/5] w-2/3 justify-self-end sm:w-1/2 lg:col-span-3 lg:col-start-10 lg:w-full"
          />
        </div>
      </section>

      <div className="mt-section-tight">
        <PageIndex items={chapters} />
      </div>

      {/* 01–03 Vergelijking in doorsnede */}
      <section aria-label="Manicure, BIAB en acryl vergeleken" className="mt-section px-gutter">
        <p className="max-w-measure text-small text-ink-soft">
          Doorsnede van een vingertop. De donkere lijn is je eigen nagel; het bronzen
          vlak is wat ik erop aanbreng.
        </p>
        <div className="mt-10 grid gap-x-8 gap-y-16 md:grid-cols-3">
          {comparisons.map((item) => (
            <article
              key={item.id}
              id={item.id}
              aria-labelledby={`${item.id}-titel`}
              className="scroll-mt-8"
            >
              <div className="border-b border-line pb-4">
                <NailProfile treatment={item.id} />
              </div>
              <SectionHeading id={`${item.id}-titel`} number={item.number} size="s" className="mt-8">
                {item.title}
              </SectionHeading>
              {item.text.map((paragraph, index) => (
                <p
                  key={paragraph}
                  className={`mt-5 max-w-measure ${index > 0 ? "text-ink-soft" : ""}`}
                >
                  {paragraph}
                </p>
              ))}
              <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-line pt-4 text-small">
                <dt className="text-ink-soft">Stevigheid</dt>
                <dd>{item.strength}</dd>
                <dt className="text-ink-soft">Lengte</dt>
                <dd>{item.length}</dd>
              </dl>
            </article>
          ))}
        </div>
      </section>

      {/* 04 Nail art */}
      <section id="nail-art" aria-labelledby="nail-art-titel" className="mt-section scroll-mt-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
          <PhotoPlaceholder
            shot="N06"
            subject="Nail art met details, zoals 3D-bloemen of glitter"
            className="reveal aspect-[4/5] sm:aspect-[3/2] lg:col-span-7 lg:aspect-[4/3]"
          />
          <div className="px-gutter lg:col-span-5 lg:col-start-8 lg:pl-0">
            <SectionHeading id="nail-art-titel" number="04">
              Maak je set persoonlijk met nail art
            </SectionHeading>
            <p className="mt-8 max-w-measure">
              Een klassieke French, glitters, een speels design of 3D-bloemen: ik vind
              het leuk om van iedere set iets persoonlijks te maken. Je kunt nail art
              bijboeken bij gellak, BIAB en acryl.
            </p>
            <p className="mt-5 max-w-measure text-ink-soft">
              Heb je ergens mooie nagels gezien of een voorbeeld opgeslagen? Laat het me
              vooraf zien, dan bespreken we wat mogelijk is.
            </p>
            {nailArt?.priceCents != null && (
              <p className="figures mt-6 text-small">
                Nail art: {formatEuro(nailArt.priceCents)} per nagel
              </p>
            )}
          </div>
        </div>
        <PhotoPlaceholder
          shot="W05"
          subject="Nail art in wording: penseel en details"
          className="reveal relative mx-gutter mt-10 aspect-square w-1/2 sm:w-1/3 lg:-mt-24 lg:ml-[38%] lg:w-1/5 lg:outline-8 lg:outline-cream"
        />
      </section>

      {/* Eigen nagels */}
      <section aria-labelledby="zorg-titel" className="mt-section bg-ivory px-gutter py-section-tight">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <PhotoPlaceholder
            shot="W04"
            subject="Product afweken in plaats van wegvijlen"
            className="reveal aspect-[3/2] lg:col-span-5"
          />
          <div className="lg:col-span-5 lg:col-start-7">
            <SectionHeading id="zorg-titel" size="s">
              Ook je eigen nagels verdienen aandacht
            </SectionHeading>
            <p className="mt-6 max-w-measure">
              Ik werk zorgvuldig en houd rekening met de natuurlijke vorm van je nagels.
              Bij BIAB en acryl zorg ik voor een opbouw die de nagel goed ondersteunt.
            </p>
            <p className="mt-5 max-w-measure text-ink-soft">
              Ook bij het verwijderen ben ik voorzichtig: ik week het product af in plaats
              van alles tot op de natuurlijke nagelplaat weg te vijlen. Zo probeer ik
              onnodige beschadiging te voorkomen.
            </p>
          </div>
        </div>
      </section>

      {/* 05 Onderhoud */}
      <section id="onderhoud" aria-labelledby="onderhoud-titel" className="mt-section scroll-mt-8 px-gutter">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-3">
            <p aria-hidden="true" className="figures text-display-xl leading-none font-medium">
              3
            </p>
            <p aria-hidden="true" className="label mt-3 text-ink-soft">
              weken, ongeveer, tussen twee afspraken
            </p>
          </div>
          <div className="lg:col-span-6 lg:col-start-5 lg:pt-4">
            <SectionHeading id="onderhoud-titel" number="05">
              Onderhoud en reparatie
            </SectionHeading>
            <p className="mt-8 max-w-measure">
              Ik zie je graag ongeveer iedere drie weken terug om je nagels weer bij te
              werken. Wacht je langer, dan wordt de kans op breken of scheuren groter.
              Breekt er binnen de eerste week na je BIAB- of acrylbehandeling toch een
              nagel? Laat het me weten, dan repareer ik deze kosteloos.
            </p>
            <p className="mt-5 max-w-measure text-ink-soft">
              Gebruik thuis regelmatig nagelriemolie en trek of knip velletjes niet zelf
              los. Zo help je jouw nagels en nagelriemen verzorgd te houden.
            </p>
          </div>
        </div>
      </section>

      {/* 06 Tarieven */}
      <section id="tarieven" aria-labelledby="tarieven-titel" className="mt-section scroll-mt-8 px-gutter">
        <div className="border-t border-line-strong pt-section-tight">
          <SectionHeading id="tarieven-titel" number="06">
            Nagels tarieven
          </SectionHeading>
          <div className="mt-12 grid gap-x-8 gap-y-14 lg:grid-cols-2">
            <div>
              <h3 className="text-lede font-medium">Manicure</h3>
              <div className="mt-5">
                <PriceList rows={manicureRows} caption="Prijzen manicure" />
              </div>
            </div>
            <div>
              <h3 className="text-lede font-medium">BIAB</h3>
              <div className="mt-5">
                <SetRefillTable rows={setRefillRows(biab)} caption="Prijzen BIAB" />
              </div>
            </div>
            <div>
              <h3 className="text-lede font-medium">Acryl</h3>
              <div className="mt-5">
                <SetRefillTable rows={setRefillRows(acryl)} caption="Prijzen acryl" />
              </div>
            </div>
            <div>
              <h3 className="text-lede font-medium">Verwijderen</h3>
              <div className="mt-5">
                <PriceList rows={removalRows} caption="Prijzen verwijderen" />
              </div>
              {nailArt?.priceCents != null && (
                <p className="mt-6 text-small text-ink-soft">
                  Nail art kun je bijboeken bij gellak, BIAB en acryl:{" "}
                  <span className="figures">{formatEuro(nailArt.priceCents)}</span> per
                  nagel.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Afsluiting */}
      <section aria-labelledby="kiezen-titel" className="mt-section px-gutter">
        <div className="grid gap-10 border-t border-line-strong pt-section-tight lg:grid-cols-12 lg:gap-8">
          <h2 id="kiezen-titel" className="text-display-l font-medium text-balance lg:col-span-6">
            Hulp nodig bij het kiezen
          </h2>
          <div className="lg:col-span-5 lg:col-start-8 lg:pt-3">
            <p className="max-w-measure text-lede">
              Twijfel je over de juiste behandeling? Bel me gerust op{" "}
              <a href={site.phone.href} className="figures underline decoration-bronze underline-offset-4">
                {site.phone.display}
              </a>
              . Ik denk graag met je mee.
            </p>
            <div className="mt-10">
              <ActionLink href={bookingHref}>Maak een nagelafspraak</ActionLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
