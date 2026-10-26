import Link from "next/link";
import { createReleaseAction, depositPaidAction, revokeReleaseAction } from "@/app/admin/afspraken/actions";
import { releaseStateLabels } from "@/domain/release";
import { formatEuro } from "@/lib/format";
import { addDays, formatLongDate, formatMoment, localDateString, utcToZonedParts } from "@/lib/time";
import type { listReleasesForCustomer, listReleaseVariants } from "@/server/booking/release";
import { ActionForm } from "./action-form";
import { AdminSection } from "./admin-page";
import { DateField, TextArea, TextField } from "./fields";

/*
 * Na het consult: een nieuwe plaatsing vrijgeven. Jessie legt lengte, banen,
 * prijs en duur vast en stuurt de klant een link om zelf een tijd aan te
 * vragen. Een aanbetaling is alleen een notitie (geen betaalsysteem).
 */

type Releases = Awaited<ReturnType<typeof listReleasesForCustomer>>;
type Variants = Awaited<ReturnType<typeof listReleaseVariants>>;

/** Voorstel voor de geldigheid van een nieuwe link; Jessie past hem per link aan. */
const defaultValidDays = 28;

export function ReleaseSection({
  appointmentId,
  customerName,
  releases,
  variants,
}: {
  appointmentId: string;
  customerName: string;
  releases: Releases;
  variants: Variants;
}) {
  return (
    <AdminSection
      id="vrijgave"
      title="Nieuwe plaatsing vrijgeven"
      intro={`Na het consult: leg vast wat jullie hebben afgesproken. ${customerName} krijgt een link om zelf een tijd aan te vragen, met precies deze duur. Die aanvraag bevestig je daarna zoals altijd.`}
    >
      {releases.length > 0 && (
        <ul className="mb-10 border-t border-line-strong">
          {releases.map((release) => {
            const lastDay = utcToZonedParts(new Date(release.expiresAt.getTime() - 1)).date;
            const linked = release.appointments.find((item) => item.status !== "rejected" && item.status !== "expired");
            return (
              <li key={release.id} className="grid gap-3 border-b border-line py-5">
                <div>
                  <p className="font-medium">
                    {release.variantLabel} · {formatEuro(release.priceCents)} · {release.durationMinutes} minuten
                  </p>
                  <p className="text-small text-ink-soft">
                    {releaseStateLabels[release.state]}
                    {release.state === "open" && `, tot en met ${formatLongDate(lastDay)}`}
                    {" · gemaakt "}
                    {formatMoment(release.createdAt)}
                  </p>
                  {release.colourNotes && (
                    <p className="mt-1 whitespace-pre-line text-small">{release.colourNotes}</p>
                  )}
                  {linked && (
                    <Link
                      href={`/admin/afspraken/${linked.id}`}
                      className="mt-1 inline-block text-small underline underline-offset-4"
                    >
                      Bekijk de afspraak van {formatMoment(linked.startAt)}
                    </Link>
                  )}
                </div>
                <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3 text-small">
                  {release.depositCents !== null && (
                    <>
                      <span>
                        Aanbetaling {formatEuro(release.depositCents)}:{" "}
                        {release.depositPaidAt ? "ontvangen" : "nog niet ontvangen"}
                      </span>
                      <ActionForm
                        action={depositPaidAction}
                        submitLabel={release.depositPaidAt ? "Toch niet ontvangen" : "Markeer als ontvangen"}
                        quiet
                      >
                        <input type="hidden" name="releaseId" value={release.id} />
                        <input type="hidden" name="paid" value={release.depositPaidAt ? "nee" : "ja"} />
                      </ActionForm>
                    </>
                  )}
                  {release.state === "open" && (
                    <ActionForm action={revokeReleaseAction} submitLabel="Link intrekken" quiet>
                      <input type="hidden" name="releaseId" value={release.id} />
                    </ActionForm>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ActionForm action={createReleaseAction} submitLabel="Link maken" resetOnSuccess>
        <input type="hidden" name="appointmentId" value={appointmentId} />
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="vrijgave-variant" className="field-label">
              Lengte en aantal banen
            </label>
            <select id="vrijgave-variant" name="variantId" required defaultValue="" className="field-input">
              <option value="" disabled>
                Kies
              </option>
              {variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.label}
                  {variant.priceCents !== null && ` — ${formatEuro(variant.priceCents)}`}
                </option>
              ))}
            </select>
          </div>
          <TextField
            name="duration"
            label="Duur in minuten"
            inputMode="numeric"
            maxLength={3}
            required
            hint="Zoveel tijd zoekt de klant in je agenda."
          />
          <TextField
            name="price"
            label="Prijs (optioneel)"
            inputMode="decimal"
            maxLength={12}
            hint="Leeg = de prijs uit je prijslijst."
          />
          <TextField
            name="deposit"
            label="Aanbetaling (optioneel)"
            inputMode="decimal"
            maxLength={12}
            hint="Alleen als notitie; er wordt niets afgeschreven."
          />
          <DateField
            name="validUntil"
            label="Link werkt tot en met"
            min={addDays(localDateString(), 1)}
            value={addDays(localDateString(), defaultValidDays)}
            required
          />
          <div className="sm:col-span-2">
            <TextArea
              name="colourNotes"
              label="Kleur en afspraken (optioneel)"
              hint="De klant ziet dit op de pagina van de link."
              rows={3}
            />
          </div>
        </div>
      </ActionForm>
    </AdminSection>
  );
}
