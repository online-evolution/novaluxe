import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingFlow } from "@/components/booking/booking-flow";
import { PageOpening } from "@/components/page/page-opening";
import { site } from "@/config/site";
import { getCatalog } from "@/server/catalog";
import { getSettings } from "@/server/settings";

export const metadata: Metadata = {
  title: "Afspraak aanvragen",
  description:
    "Vraag een afspraak aan bij NovaLuxe in Kijkduin: kies nagels of extensions, je behandeling en een datum en tijd die jou uitkomen.",
};

/*
 * Teksten uit docs/bron (Reserveren). De keuze voor "Afspraak aanvragen" in
 * plaats van "Bevestig mijn afspraak" is goedgekeurd: Jessie bevestigt eerst.
 * Opbouw zoals de andere pagina's: een opening in brons met de salonfoto (S01),
 * daarna de wizard als crème kaart met gouden lijntje op ivoor.
 */
export default async function BookingPage() {
  const [catalog, settings] = await Promise.all([getCatalog(), getSettings()]);

  return (
    <>
      <PageOpening id="reserveren-titel" title="Plan jouw afspraak bij Jessie" backdrop="S01">
        <p className="mx-auto mt-6 max-w-measure text-lede">
          Leuk dat je een afspraak wilt maken. Kies hieronder nagels of extensions, selecteer je behandeling en zoek een
          datum en tijd die jou uitkomen. Ik zie je graag in de salon!
        </p>
      </PageOpening>

      <section aria-label="Afspraak aanvragen" className="bg-ivory px-gutter py-section-tight">
        <div className="booking-card mx-auto max-w-4xl px-5 pt-[clamp(3rem,8vw,5rem)] pb-10 sm:px-10 sm:pb-14 lg:px-16">
          <Suspense fallback={<p className="mx-auto max-w-3xl text-ink-soft">Even laden…</p>}>
            <BookingFlow
              catalog={catalog}
              nailArtBufferMinutes={settings.nailArtDefaultBufferMinutes}
              phone={site.phone}
            />
          </Suspense>
        </div>

        <aside aria-labelledby="hulp" className="mx-auto mt-section-tight max-w-3xl text-center">
          <h2 id="hulp" className="text-display-s font-semibold">
            Hulp nodig bij het kiezen
          </h2>
          <p className="mt-3 text-lede">
            Twijfel je over de juiste behandeling? Bel me gerust op{" "}
            <a href={site.phone.href} className="figures underline decoration-gold underline-offset-4">
              {site.phone.display}
            </a>
            . Ik denk graag met je mee.
          </p>
        </aside>
      </section>
    </>
  );
}
