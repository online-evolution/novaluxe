import Image from "next/image";
import { focusPosition } from "@/components/media/focus";
import { BigLink } from "@/components/ui/action";
import { bookingHref } from "@/config/navigation";
import { getSitePhotos } from "@/server/photos";

/**
 * Afsluiter vóór de footer. Maakt duidelijk dat Jessie eerst bevestigt, zonder
 * een afspraak als direct definitief te presenteren. De salonfoto van de opening
 * (S04) schemert er in brons doorheen, zodat de pagina eindigt waar hij begon.
 */
export async function HomeBooking() {
  const photo = (await getSitePhotos()).S04;

  return (
    <section
      aria-labelledby="home-afspraak"
      className="relative isolate overflow-hidden bg-bronze-deep px-gutter py-section text-center text-cream"
    >
      {photo && (
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-bronze-deep">
          <Image
            src={photo.url}
            alt=""
            fill
            sizes="100vw"
            className="cta-foto object-cover"
            style={{ objectPosition: focusPosition[photo.focus] }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_50%,rgb(58_40_26/0.72),rgb(58_40_26/0.35)_100%)]" />
        </div>
      )}
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
