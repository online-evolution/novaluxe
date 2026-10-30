import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ReleaseBooking } from "@/components/booking/release-booking";
import { site } from "@/config/site";
import { formatEuro } from "@/lib/format";
import { formatLongDate, utcToZonedParts } from "@/lib/time";
import { getAvailability } from "@/server/booking/availability";
import { findOpenRelease } from "@/server/booking/release";

// Persoonlijke link: niet indexeren en het token niet doorgeven aan andere sites.
export const metadata: Metadata = {
  title: "Je nieuwe extensions plannen",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function ReleasePage({ params }: PageProps<"/reserveren/plaatsing/[token]">) {
  return (
    <div className="px-gutter py-section-tight">
      <div className="mx-auto max-w-3xl">
        <Suspense fallback={<p className="text-ink-soft">Even laden…</p>}>
          <Release params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function Release({ params }: Pick<PageProps<"/reserveren/plaatsing/[token]">, "params">) {
  await connection();
  const { token } = await params;
  const release = await findOpenRelease(token);

  if (!release) {
    return (
      <>
        <h1 className="text-display-l font-semibold text-balance">Deze link werkt niet (meer)</h1>
        <p className="mt-6 max-w-measure text-lede">
          Misschien is hij verlopen, of heb je al een tijd aangevraagd. Bel of app Jessie op{" "}
          <a href={site.phone.href} className="figures underline decoration-bronze underline-offset-4">
            {site.phone.display}
          </a>
          , dan regelen we het samen.
        </p>
      </>
    );
  }

  const days = await getAvailability(release.durationMinutes);
  const lastDay = utcToZonedParts(new Date(release.expiresAt.getTime() - 1)).date;

  return (
    <>
      <h1 className="text-display-l font-semibold text-balance">
        Hoi {release.firstName}, plan je nieuwe extensions
      </h1>
      <p className="mt-6 max-w-measure text-lede text-ink-soft">
        Dit hebben we bij het consult afgesproken. Kies hieronder een moment dat jou uitkomt.
      </p>

      <dl className="mt-10">
        <Row label="Behandeling">
          {release.treatmentName}, {release.variantLabel}
        </Row>
        <Row label="Prijs">{formatEuro(release.priceCents)}</Row>
        <Row label="Duur">{release.durationMinutes} minuten</Row>
        {release.colourNotes && (
          <Row label="Afspraken">
            <span className="whitespace-pre-line">{release.colourNotes}</span>
          </Row>
        )}
        {release.depositCents !== null && (
          <Row label="Aanbetaling">
            {formatEuro(release.depositCents)}
            {release.depositPaid ? ", ontvangen" : ""}
          </Row>
        )}
        <Row label="Link geldig">tot en met {formatLongDate(lastDay)}</Row>
      </dl>

      <h2 className="mt-14 text-display-s font-semibold">Kies een datum en tijd</h2>
      <ReleaseBooking token={token} days={days} phone={site.phone} />
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-4 border-b-2 border-dotted border-sand py-3 sm:grid-cols-[9rem_1fr]">
      <dt className="text-small text-ink-soft">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
