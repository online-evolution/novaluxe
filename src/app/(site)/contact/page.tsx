import type { Metadata } from "next";
import { DottedRow } from "@/components/page/dotted-row";
import { PageOpening } from "@/components/page/page-opening";
import { PageSection, SectionTitle, SplitSection } from "@/components/page/page-section";
import { PhotoClosing } from "@/components/page/photo-closing";
import { ContactForm } from "@/components/contact/contact-form";
import { Icon, type IconName } from "@/components/ui/icons";
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
// Route via Google Maps in een nieuw venster; op de pagina zelf staat de kaart van OpenStreetMap.
const routeHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

const iconCircle = "grid size-14 shrink-0 place-items-center rounded-full border border-gold text-bronze-deep";
const iconHover =
  "transition-colors duration-(--duration-quick) group-hover:bg-gold group-hover:bg-(image:--gold-foil) group-hover:text-ink";

// Kaart van OpenStreetMap: geen trackingcookies, dus geen toestemming nodig (Google Maps wel).
// De kaart centreert op het adres; de gouden markering staat daarom in het midden.
const { lat, lon } = site.geo;
const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.007},${lat - 0.0028},${lon + 0.007},${lat + 0.0028}&layer=mapnik`;

const channels: { icon: IconName; label: string; value: string; href: string; external: boolean }[] = [
  { icon: "phone", label: "Bellen", value: site.phone.display, href: site.phone.href, external: false },
  { icon: "instagram", label: "Instagram", value: site.instagram.handle, href: site.instagram.href, external: true },
  { icon: "facebook", label: "Facebook", value: site.name, href: site.facebook.href, external: true },
];

/*
 * Teksten uit docs/bron (Contact); openingstijden en uitzonderingen uit de
 * database. Opbouw zoals de andere pagina's: een opening in brons met de
 * salonfoto (S04), de salon met adres en contactgegevens naast de entree (S03),
 * een contactformulier, de openingstijden en één afsluiter in brons.
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
          <a href={routeHref} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-4">
            <span className={`${iconCircle} ${iconHover}`}>
              <Icon name="pin" className="size-6" />
            </span>
            <span>
              <span className="block text-small text-ink-soft">Adres</span>
              <span className="block decoration-gold underline-offset-4 group-hover:underline">
                {site.name}
                <br />
                {site.address.street}
                <br />
                {site.address.postalCode} {site.address.city}
              </span>
              <span className="sr-only">(route in Google Maps, opent in een nieuw venster)</span>
            </span>
          </a>
        </address>

        <h3 className="mt-14 text-display-s font-semibold">Bel of stuur een bericht</h3>
        <ul className="mt-6 grid gap-6 sm:grid-cols-3">
          {channels.map((channel) => (
            <li key={channel.label}>
              <a
                href={channel.href}
                {...(channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group flex items-center gap-4 sm:flex-col sm:items-start"
              >
                <span className={`${iconCircle} ${iconHover}`}>
                  <Icon name={channel.icon} className="size-6" />
                </span>
                <span>
                  <span className="block text-small text-ink-soft">{channel.label}</span>
                  <span className="figures block text-lede font-semibold decoration-gold underline-offset-4 group-hover:underline">
                    {channel.value}
                  </span>
                  {channel.external && <span className="sr-only">(opent in een nieuw venster)</span>}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </SplitSection>

      <PageSection id="bericht" labelledBy="bericht-titel" tone="ivory" contained>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionTitle id="bericht-titel">Stuur me een bericht</SectionTitle>
            <p className="mt-8 max-w-measure text-lede">
              Heb je een vraag over een behandeling of over je afspraak? Laat hier een bericht achter, dan neem ik zo snel
              mogelijk contact met je op.
            </p>
          </div>
          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      </PageSection>

      <PageSection labelledBy="tijden-titel" contained>
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

      {/* Kaart over de volle breedte. Wie erop tikt, krijgt de route; zo vangt de kaart ook het scrollen niet af. */}
      <div className="relative h-[clamp(20rem,45vw,32rem)] overflow-hidden bg-ivory">
        <iframe
          src={mapSrc}
          title={`Kaart met de ligging van ${site.name}, ${site.address.street} in ${site.address.city}`}
          loading="lazy"
          tabIndex={-1}
          className="pointer-events-none absolute inset-0 size-full border-0 [filter:grayscale(1)_sepia(0.3)_contrast(0.95)]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center pb-1"
        >
          <span className="grid size-12 place-items-center rounded-full bg-gold bg-(image:--gold-foil) text-ink shadow-print">
            <Icon name="pin" className="size-6" />
          </span>
          <span className="-mt-1 size-3 rotate-45 bg-gold" />
        </span>
        <a
          href={routeHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0"
        />
      </div>

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
