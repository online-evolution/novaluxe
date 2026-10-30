import type { Route } from "next";
import { SitePhoto } from "@/components/media/site-photo";
import { BigLink } from "@/components/ui/action";

const photoSizes = "(min-width: 1024px) 464px, (min-width: 640px) 46vw, 100vw";

function Treatment({
  id,
  title,
  shot,
  subject,
  href,
  linkLabel,
  children,
}: {
  id: string;
  title: string;
  shot: string;
  subject: string;
  href: Route;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <article aria-labelledby={id} className="@container flex flex-col">
      <SitePhoto shot={shot} subject={subject} className="aspect-[4/5] w-full" sizes={photoSizes} />
      {/* Meeschalend met de kolom: de langste titel past zo op één regel. */}
      <h2 id={id} className="mt-6 text-display-s font-semibold [font-size:min(8.7cqi,2.75rem)]!">
        {title}
      </h2>
      <p className="mt-4 mb-6 max-w-measure">{children}</p>
      {/* mt-auto: de knoppen staan op één lijn, ook bij ongelijke tekst. */}
      <BigLink href={href} size="md" className="mt-auto self-start">
        {linkLabel}
      </BigLink>
    </article>
  );
}

/** Extensions en nagels naast elkaar, elk met één foto. */
export function HomeTreatments() {
  return (
    <section aria-label="Behandelingen" className="bg-ivory px-gutter py-section-tight">
      <div className="mx-auto grid max-w-5xl gap-12 sm:grid-cols-2 lg:gap-16">
        <Treatment
          id="home-extensions"
          title="Haar dat bij jou past"
          shot="E01"
          subject="Extensions: resultaat van achteren, natuurlijke val"
          href="/extensions"
          linkLabel="Ontdek extensions"
        >
          Droom je van langer haar of mis je wat volume? Met extensions stem ik de lengte, kleur en hoeveelheid haar af op
          jouw wensen en je natuurlijke haar. Ik werk voornamelijk met ultradunne Genius Wefts, geplaatst met een invisible
          techniek. We beginnen altijd met een gratis consult om te kijken wat bij jou past.
        </Treatment>
        <Treatment
          id="home-nagels"
          title="Jouw nagels in jouw stijl"
          shot="N03"
          subject="BIAB naturel of French op de eigen nagel"
          href="/nagels"
          linkLabel="Bekijk de nagelbehandelingen"
        >
          Een verzorgde naturel look, een mooie kleur of een set met opvallende nail art. Bij NovaLuxe kun je terecht voor
          manicures, gellak, BIAB en acryl. Samen kiezen we een behandeling, vorm en afwerking die passen bij jouw nagels en
          de uitstraling die je zoekt.
        </Treatment>
      </div>
    </section>
  );
}
