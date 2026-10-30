import type { Metadata, Route } from "next";
import { DottedRow } from "@/components/page/dotted-row";
import { PageOpening } from "@/components/page/page-opening";
import { PageSection, SectionTitle } from "@/components/page/page-section";
import { BigLink } from "@/components/ui/action";
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
      <PageOpening id="contact-titel" title="Heb je een vraag">
        <p className="mx-auto mt-6 max-w-measure text-lede">
          Wil je iets weten over een behandeling of twijfel je wat je moet boeken? Neem gerust contact op. Ik luister naar
          je wensen en denk met je mee.
        </p>
        <h2 className="sr-only">Contactgegevens</h2>
        <ul className="mt-10 flex flex-wrap justify-center gap-x-16 gap-y-6">
          <li>
            <p className="font-medium">Bel NovaLuxe</p>
            <a
              href={site.phone.href}
              className="figures mt-1 inline-block text-display-m font-semibold decoration-bronze underline-offset-8 hover:underline"
            >
              {site.phone.display}
            </a>
          </li>
          <li>
            <p className="font-medium">Bekijk Instagram</p>
            <a
              href={site.instagram.href}
              className="mt-1 inline-block text-display-m font-semibold decoration-bronze underline-offset-8 hover:underline"
            >
              {site.instagram.handle}
            </a>
          </li>
        </ul>
        <p className="figures mt-6 text-small text-ink-soft">KvK-nummer {site.kvk}</p>
      </PageOpening>

      <PageSection labelledBy="salon-titel" shot="S03" subject="De entree van de salon">
        <div className="grid gap-12">
          <div>
            <SectionTitle id="salon-titel">Je vindt de salon in {site.area}</SectionTitle>
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
              className="mt-6 inline-block font-semibold underline underline-offset-4 hover:text-bronze-deep"
            >
              Plan je route <span className="sr-only">(opent in een nieuw venster)</span>
            </a>
          </div>

          <div>
            <h3 className="text-display-s font-semibold">Openingstijden</h3>
            <dl className="mt-4 text-lede">
              {weekdayRows(week).map((row) => (
                <DottedRow key={row.days} label={row.days} value={<TimeRanges text={row.hours} />} />
              ))}
            </dl>

            {exceptions.length > 0 && (
              <>
                <h3 className="mt-10 text-display-s font-semibold">Afwijkende openingstijden</h3>
                <dl className="mt-4">
                  {exceptions.map((exception) => (
                    <DottedRow
                      key={exception.date}
                      label={<span className="inline-block first-letter:uppercase">{formatLongDate(exception.date)}</span>}
                      value={<TimeRanges text={exception.closed ? "Gesloten" : formatRanges(exception.ranges)} />}
                    />
                  ))}
                </dl>
              </>
            )}
          </div>
        </div>
      </PageSection>

      <section aria-label="Afspraak maken" className="grid gap-14 bg-bronze-deep px-gutter py-section-tight text-cream lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="text-display-m font-semibold text-balance">Interesse in extensions</h2>
          <p className="mt-6 max-w-measure text-lede">
            Benieuwd of extensions iets voor jou zijn? Kom langs voor een gratis consult. Dan bekijk ik je haar en praten
            we over wat jij graag zou willen. Je krijgt eerlijk advies en weet meteen wat het kost.
          </p>
          <div className="mt-8">
            <BigLink href={consultHref} tone="cream">
              Plan je gratis consult
            </BigLink>
          </div>
        </div>
        <div>
          <h2 className="text-display-m font-semibold text-balance">Klaar voor je volgende afspraak</h2>
          <p className="mt-6 max-w-measure text-lede">
            Weet je al waarvoor je wilt komen? Via de reserveringspagina kies je jouw nagel- of extensionsbehandeling en
            een beschikbare datum en tijd.
          </p>
          <div className="mt-8">
            <BigLink href={bookingHref} tone="cream">
              Naar reserveren
            </BigLink>
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
