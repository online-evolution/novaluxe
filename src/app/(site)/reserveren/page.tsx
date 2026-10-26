import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingFlow } from "@/components/booking/booking-flow";
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
 */
export default async function BookingPage() {
  const [catalog, settings] = await Promise.all([getCatalog(), getSettings()]);

  return (
    <div className="px-gutter pt-section-tight">
      <header className="mx-auto max-w-3xl">
        <p className="label text-bronze-deep">Afspraak aanvragen</p>
        <h1 className="mt-4 text-display-l font-medium text-balance">Plan jouw afspraak bij Jessie</h1>
        <p className="mt-6 max-w-measure text-lede text-ink-soft">
          Leuk dat je een afspraak wilt maken. Kies hieronder nagels of extensions, selecteer je
          behandeling en zoek een datum en tijd die jou uitkomen. Ik zie je graag in de salon!
        </p>
      </header>

      <div className="mt-section-tight">
        <Suspense fallback={<p className="mx-auto max-w-3xl text-ink-soft">Even laden…</p>}>
          <BookingFlow
            catalog={catalog}
            nailArtBufferMinutes={settings.nailArtDefaultBufferMinutes}
            phone={site.phone}
          />
        </Suspense>
      </div>

      <aside aria-labelledby="hulp" className="mx-auto mt-section-tight max-w-3xl border-t border-line-strong pt-8">
        <h2 id="hulp" className="font-medium">Hulp nodig bij het kiezen</h2>
        <p className="mt-2 text-ink-soft">
          Twijfel je over de juiste behandeling? Bel me gerust op{" "}
          <a href={site.phone.href} className="figures underline decoration-bronze underline-offset-4">
            {site.phone.display}
          </a>
          . Ik denk graag met je mee.
        </p>
      </aside>
    </div>
  );
}
