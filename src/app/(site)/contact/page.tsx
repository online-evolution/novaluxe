import type { Metadata, Route } from "next";
import { PhotoPlaceholder } from "@/components/media/photo-placeholder";
import { ActionLink, actionClass } from "@/components/ui/action";
import { bookingHref } from "@/config/navigation";
import { site } from "@/config/site";
import { formatRanges, weekdayRows } from "@/domain/hours";
import { formatLongDate } from "@/lib/time";
import { getUpcomingExceptions, getWeeklyHours } from "@/server/schedule";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Vragen over extensions of nagels? Bel NovaLuxe op 06 13867266 of stuur een bericht via Instagram. Je vindt de salon aan de Wijndaelerduin 25 in Kijkduin, Den Haag.",
};

const consultHref: Route = "/reserveren?behandeling=gratis-consult";

const fullAddress = `${site.address.street}, ${site.address.postalCode} ${site.address.city}`;
// Gewone link naar een kaartdienst; bewust geen ingesloten kaart (geen cookies of tracking).
const routeHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

/*
 * Teksten uit docs/bron (Contact); openingstijden en uitzonderingen uit de database.
 */
export default async function ContactPage() {
  const [week, exceptions] = await Promise.all([getWeeklyHours(), getUpcomingExceptions()]);

  return (
    <>
      {/* Opening: vraag en directe contactmogelijkheden */}
      <section aria-labelledby="contact-titel" className="px-gutter pt-section-tight">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6">
            <p className="label text-bronze-deep">Contact</p>
            <h1 id="contact-titel" className="mt-4 text-display-l font-medium text-balance">
              Heb je een vraag
            </h1>
            <p className="mt-8 max-w-measure text-lede">
              Wil je iets weten over een behandeling of twijfel je wat je moet boeken?
              Neem gerust contact op. Ik luister naar je wensen en denk met je mee.
            </p>
          </div>

          <div className="lg:col-span-5 lg:col-start-8 lg:self-end">
            <h2 className="sr-only">Contactgegevens</h2>
            <ul className="border-t border-line-strong">
              <li className="border-b border-line py-5">
                <p className="label text-ink-soft">Bel NovaLuxe</p>
                <a
                  href={site.phone.href}
                  className="figures mt-1 inline-block text-display-m font-medium decoration-bronze underline-offset-8 hover:underline"
                >
                  {site.phone.display}
                </a>
              </li>
              <li className="border-b border-line py-5">
                <p className="label text-ink-soft">Bekijk Instagram</p>
                <a
                  href={site.instagram.href}
                  className="mt-1 inline-block text-display-m font-medium decoration-bronze underline-offset-8 hover:underline"
                >
                  {site.instagram.handle}
                </a>
              </li>
            </ul>
            <p className="figures mt-4 text-small text-ink-soft">KvK-nummer {site.kvk}</p>
          </div>
        </div>
      </section>

      {/* Locatie en openingstijden */}
      <section aria-labelledby="salon-titel" className="mt-section px-gutter">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <PhotoPlaceholder
            shot="S03"
            subject="De entree van de salon"
            className="reveal aspect-[4/3] lg:col-span-5 lg:aspect-[4/5]"
          />

          <div className="lg:col-span-6 lg:col-start-7">
            <h2 id="salon-titel" className="text-display-m font-medium text-balance">
              Je vindt de salon in {site.area}
            </h2>
            <address className="mt-6 text-display-s font-medium not-italic">
              {site.name}
              <br />
              {site.address.street}
              <br />
              {site.address.postalCode} {site.address.city}
            </address>
            <a
              href={routeHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${actionClass("quiet")} mt-8`}
            >
              Plan je route <span className="sr-only">(opent in een nieuw venster)</span>
            </a>

            <h3 className="mt-14 text-lede font-medium">Openingstijden</h3>
            <dl className="figures mt-4 border-t border-line-strong">
              {weekdayRows(week).map((row) => (
                <div
                  key={row.days}
                  className="flex items-baseline justify-between gap-6 border-b border-line py-3"
                >
                  <dt>{row.days}</dt>
                  <dd className={`text-right ${row.hours === "Gesloten" ? "text-ink-soft" : ""}`}>
                    <TimeRanges text={row.hours} />
                  </dd>
                </div>
              ))}
            </dl>

            {exceptions.length > 0 && (
              <>
                <h3 className="mt-10 text-lede font-medium">Afwijkende openingstijden</h3>
                <dl className="figures mt-4 border-t border-line-strong">
                  {exceptions.map((exception) => (
                    <div
                      key={exception.date}
                      className="flex items-baseline justify-between gap-6 border-b border-line py-3"
                    >
                      <dt className="first-letter:uppercase">{formatLongDate(exception.date)}</dt>
                      <dd className={`text-right ${exception.closed ? "text-bronze-deep" : ""}`}>
                        <TimeRanges
                          text={exception.closed ? "Gesloten" : formatRanges(exception.ranges)}
                        />
                      </dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Doorverwijzingen */}
      <section aria-label="Afspraak maken" className="mt-section px-gutter">
        <div className="grid border-t border-line-strong lg:grid-cols-2">
          <div className="py-section-tight lg:border-r lg:border-line lg:pr-12">
            <h2 className="text-display-m font-medium text-balance">Interesse in extensions</h2>
            <p className="mt-6 max-w-measure">
              Benieuwd of extensions iets voor jou zijn? Kom langs voor een gratis
              consult. Dan bekijk ik je haar en praten we over wat jij graag zou willen.
              Je krijgt eerlijk advies en weet meteen wat het kost.
            </p>
            <div className="mt-10">
              <ActionLink variant="quiet" href={consultHref}>
                Plan je gratis consult
              </ActionLink>
            </div>
          </div>
          <div className="border-t border-line py-section-tight lg:border-t-0 lg:pl-12">
            <h2 className="text-display-m font-medium text-balance">
              Klaar voor je volgende afspraak
            </h2>
            <p className="mt-6 max-w-measure">
              Weet je al waarvoor je wilt komen? Via de reserveringspagina kies je jouw
              nagel- of extensionsbehandeling en een beschikbare datum en tijd.
            </p>
            <div className="mt-10">
              <ActionLink href={bookingHref}>Naar reserveren</ActionLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/** Meerdere tijdvakken op één dag onder elkaar, nooit midden in een tijd afgebroken. */
function TimeRanges({ text }: { text: string }) {
  return text.split(", ").map((part) => (
    <span key={part} className="block whitespace-nowrap">
      {part}
    </span>
  ));
}
