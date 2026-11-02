import Image from "next/image";
import { focusPosition } from "@/components/media/focus";
import { BigLink } from "@/components/ui/action";
import { bookingHref } from "@/config/navigation";
import { getSitePhotos } from "@/server/photos";

/**
 * Afsluiter vóór de footer. Maakt duidelijk dat Jessie eerst bevestigt, zonder
 * een afspraak als direct definitief te presenteren. De tekst staat in een boog
 * zoals de spiegels in de salon; daarin schuift de salonfoto van de opening
 * (S04) in brons door de ruimte, zodat de pagina eindigt waar hij begon.
 */
export async function HomeBooking() {
  const photo = (await getSitePhotos()).S04;

  return (
    <section aria-labelledby="home-afspraak" className="bg-bronze-deep px-gutter py-section-tight text-center text-cream">
      <div className="cta-boog relative isolate mx-auto max-w-[60rem] overflow-hidden px-6 pt-[clamp(7rem,20vw,12rem)] pb-16 sm:px-12 lg:pb-20">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-bronze-deep">
          {photo && (
            <Image
              src={photo.url}
              alt=""
              fill
              sizes="(min-width: 1024px) 960px, 100vw"
              className="cta-foto hero-pan object-cover"
              style={{ objectPosition: focusPosition[photo.focus] }}
            />
          )}
          <div className="hero-licht" />
          <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_58%,rgb(58_40_26/0.7),rgb(58_40_26/0.3)_100%)]" />
        </div>

        <h2 id="home-afspraak" className="mx-auto max-w-[14em] text-display-m font-semibold text-balance">
          Klaar voor je volgende afspraak
        </h2>
        <p className="mx-auto mt-6 max-w-measure text-lede">
          Weet je al waarvoor je wilt komen? Via de reserveringspagina kies je jouw nagel- of extensionsbehandeling en
          een beschikbare datum en tijd.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <BigLink href={bookingHref}>Maak een afspraak</BigLink>
          <BigLink href="/reserveren?behandeling=gratis-consult">Plan je gratis consult</BigLink>
        </div>
        <p className="mx-auto mt-5 max-w-measure text-small">
          Zodra Jessie je aanvraag bevestigt, ontvang je automatisch een e-mail.
        </p>
      </div>
    </section>
  );
}
