import Link from "next/link";
import { HomeButton } from "./home-button";

/**
 * Afsluiter vóór de footer. Maakt duidelijk dat Jessie eerst bevestigt, zonder
 * een afspraak als direct definitief te presenteren.
 */
export function HomeBooking() {
  return (
    <section aria-labelledby="home-afspraak" className="bg-cream px-gutter pt-section text-center">
      <h2 id="home-afspraak" className="mx-auto max-w-[14em] text-display-m font-semibold text-balance">
        Klaar voor je volgende afspraak
      </h2>
      <p className="mx-auto mt-6 max-w-measure text-lede">
        Weet je al waarvoor je wilt komen? Via de reserveringspagina kies je jouw nagel- of extensionsbehandeling en een
        beschikbare datum en tijd.
      </p>
      <div className="mt-8">
        <HomeButton />
      </div>
      <p className="mx-auto mt-5 max-w-measure text-small text-ink-soft">
        Zodra Jessie je aanvraag bevestigt, ontvang je automatisch een e-mail.
      </p>
      <Link
        href="/reserveren?behandeling=gratis-consult"
        className="mt-4 inline-block font-semibold underline underline-offset-4 hover:text-bronze-deep"
      >
        Plan je gratis consult
      </Link>
    </section>
  );
}
