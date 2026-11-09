import type { Metadata } from "next";
import { DottedRow } from "@/components/page/dotted-row";
import { PageOpening } from "@/components/page/page-opening";
import { PageSection, SectionTitle, SplitSection } from "@/components/page/page-section";
import { PhotoClosing } from "@/components/page/photo-closing";
import { BigAnchor } from "@/components/ui/action";
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

const fullAddress = `${site.address.street}, ${site.address.postalCode} ${site.address.city}`;
// Gewone link naar een kaartdienst; bewust geen ingesloten kaart (geen cookies of tracking).
const routeHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

const linkClass = "decoration-gold underline-offset-4 hover:underline";

/*
 * Teksten uit docs/bron (Contact); openingstijden en uitzonderingen uit de
 * database. Opbouw zoals de andere pagina's: een opening in brons met de
 * salonfoto (S04), de salon met adres en contactgegevens naast de entree (S03),
 * de openingstijden en één afsluiter in brons.
 */
export default async function ContactPage() {
  const [week, exceptions] = await Promise.all([getWeeklyHours(), getUpcomingExceptions()]);

  return (
    <>
      <PageOpening id="contact-titel" title="Heb je een vraag" backdrop="S04">
        <p className="mx-auto mt-6 max-w-measure text-lede">
          Wil je iets weten over een behandeling of twijfel je wat je moet boeken? Neem gerust contact op. Ik luister naar
          je wensen en denk met je mee.
        </p>
      </PageOpening>

      <SplitSection labelledBy="salon-titel" shot="S03" subject="De entree van de salon">
        <SectionTitle id="salon-titel">Je vindt de salon in {site.area}</SectionTitle>
        <address className="mt-8 text-lede not-italic">
          {site.name}
          <br />
          {site.address.street}
          <br />
          {site.address.postalCode} {site.address.city}
        </address>
        <BigAnchor href={routeHref} size="md" target="_blank" rel="noopener noreferrer" className="mt-8">
          Plan je route <span className="sr-only">(opent in een nieuw venster)</span>
        </BigAnchor>

        <h3 className="mt-14 text-display-s font-semibold">Bel of stuur een bericht</h3>
        <dl className="mt-5 max-w-measure text-lede">
          <DottedRow
            label="Bellen"
            value={
              <a href={site.phone.href} className={linkClass}>
                {site.phone.display}
              </a>
            }
          />
          <DottedRow
            label="Instagram"
            value={
              <a href={site.instagram.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {site.instagram.handle} <span className="sr-only">(opent in een nieuw venster)</span>
              </a>
            }
          />
          <DottedRow
            label="Facebook"
            value={
              <a href={site.facebook.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {site.name} <span className="sr-only">(opent in een nieuw venster)</span>
              </a>
            }
          />
        </dl>
        <p className="figures mt-6 text-small text-ink-soft">KvK-nummer {site.kvk}</p>
      </SplitSection>

      <PageSection labelledBy="tijden-titel" tone="ivory" contained>
        {/* Titel links, tijden rechts: het blok blijft in balans, ook zonder afwijkende tijden. */}
        <div className="grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-20">
          <h2 id="tijden-titel" className="text-display-m font-semibold text-balance">
            Openingstijden
          </h2>
          <div>
            <dl className="text-lede">
              {weekdayRows(week).map((row) => (
                <DottedRow key={row.days} label={row.days} value={<TimeRanges text={row.hours} />} />
              ))}
            </dl>

            {exceptions.length > 0 && (
              <>
                <h3 className="mt-12 text-display-s font-semibold">Afwijkende openingstijden</h3>
                <dl className="mt-5 text-lede">
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

      <PhotoClosing
        id="afspraak-titel"
        shot="S01"
        title="Klaar voor nieuwe nagels of extensions?"
        href={bookingHref}
        label="Maak een afspraak"
      >
        Kies je behandeling en een moment dat jou uitkomt. Ik bekijk je aanvraag en laat je weten of het past.
      </PhotoClosing>
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
