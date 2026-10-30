import { BigLink } from "@/components/ui/action";
import { bookingHref } from "@/config/navigation";

/**
 * Afsluiter vóór de footer. Maakt duidelijk dat Jessie eerst bevestigt, zonder
 * een afspraak als direct definitief te presenteren.
 */
export function HomeBooking() {
  return (
    <section aria-labelledby="home-afspraak" className="bg-bronze-deep px-gutter py-section text-center text-cream">
      <h2 id="home-afspraak" className="mx-auto max-w-[14em] text-display-m font-semibold text-balance">
        Klaar voor je volgende afspraak
      </h2>
      <p className="mx-auto mt-6 max-w-measure text-lede">
        Weet je al waarvoor je wilt komen? Via de reserveringspagina kies je jouw nagel- of extensionsbehandeling en een
        beschikbare datum en tijd.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <BigLink href={bookingHref}>Maak een afspraak</BigLink>
        <BigLink href="/reserveren?behandeling=gratis-consult">Plan je gratis consult</BigLink>
      </div>
      <p className="mx-auto mt-5 max-w-measure text-small">
        Zodra Jessie je aanvraag bevestigt, ontvang je automatisch een e-mail.
      </p>
    </section>
  );
}
