import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader, AdminSection, Loading } from "@/components/admin/admin-page";
import { StatusText } from "@/components/admin/appointment-list";
import { ReleaseSection } from "@/components/admin/release-section";
import { DateField, ForceCheckbox, TextArea, TimeField } from "@/components/admin/fields";
import { allowedActions, effectiveStatus, statusLabels } from "@/domain/appointment";
import { formatEuro } from "@/lib/format";
import { formatLongDate, formatMoment, localDateString, utcToZonedParts } from "@/lib/time";
import { getAppointmentForAdmin } from "@/server/admin/appointments";
import { requireAdmin } from "@/server/auth/session";
import { listReleasesForCustomer, listReleaseVariants } from "@/server/booking/release";
import { changeStatusAction, rescheduleAction, saveNotesAction } from "../actions";

export const metadata: Metadata = { title: "Afspraak" };

const actorLabels = { customer: "Klant", admin: "Jij", system: "Automatisch" } as const;
const doneMessages: Record<string, string> = {
  confirm: "Bevestigd.",
  reject: "Afgewezen. De tijd is weer vrij.",
  cancel: "Geannuleerd. De tijd is weer vrij.",
  complete: "Opgeslagen als geweest.",
  no_show: "Opgeslagen als niet gekomen.",
};

const sourceLabels = { online: "Online aangevraagd", admin: "Zelf ingevoerd", release: "Via vrijgavelink" } as const;

export default function AppointmentPage({ params, searchParams }: PageProps<"/admin/afspraken/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <AppointmentDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function AppointmentDetail({ params, searchParams }: PageProps<"/admin/afspraken/[id]">) {
  await requireAdmin();
  const id = z.uuid().safeParse((await params).id);
  const done = (await searchParams).gedaan;
  const doneMessage = typeof done === "string" && Object.hasOwn(doneMessages, done) ? doneMessages[done] : undefined;
  if (!id.success) notFound();
  const data = await getAppointmentForAdmin(id.data);
  if (!data) notFound();

  const { appointment, customer, options, events, history } = data;
  const [releases, releaseVariants] =
    data.category === "extensions"
      ? await Promise.all([listReleasesForCustomer(customer.id), listReleaseVariants()])
      : [[], []];
  const now = new Date();
  const status = effectiveStatus(appointment, now);
  const actions = allowedActions(appointment, now);
  const start = utcToZonedParts(appointment.startAt);
  const end = utcToZonedParts(appointment.endAt);
  const openPrices = options.filter((option) => option.priceCents === null).map((option) => option.name);

  return (
    <>
      <AdminPageHeader
        title={appointment.treatmentName}
        intro={appointment.variantLabel !== appointment.treatmentName ? appointment.variantLabel : undefined}
        back={{ href: "/admin/afspraken", label: "Afspraken" }}
      />
      {doneMessage && (
        <p role="status" className="form-message mt-8 max-w-3xl text-bronze-deep">
          {doneMessage}
        </p>
      )}

      <dl className="mt-10 grid max-w-3xl gap-x-10 gap-y-6 border-t border-line-strong pt-6 sm:grid-cols-2">
        <Detail label="Wanneer">
          <span className="block first-letter:uppercase">{formatLongDate(start.date)}</span>
          <span className="figures block">
            {start.time}–{end.time} ({appointment.durationMinutes} minuten)
          </span>
        </Detail>
        <Detail label="Status">
          <StatusText appointment={appointment} now={now} />
          {status === "pending" && appointment.expiresAt && (
            <span className="block text-small text-ink-soft">
              Bevestig of wijs af vóór {formatMoment(appointment.expiresAt)}. Daarna komt de tijd weer vrij.
            </span>
          )}
          {status === "expired" && actions.includes("confirm") && (
            <span className="block text-small text-ink-soft">
              Niet op tijd bevestigd. Je kunt hem alsnog bevestigen als de tijd nog vrij is.
            </span>
          )}
        </Detail>
        <Detail label="Klant">
          <span className="block font-medium">{customer.name}</span>
          <a href={`tel:${customer.phone.replace(/[^\d+]/g, "")}`} className="block underline underline-offset-4">
            {customer.phone}
          </a>
          {customer.email ? (
            <a href={`mailto:${customer.email}`} className="block break-all underline underline-offset-4">
              {customer.email}
            </a>
          ) : (
            <span className="block text-small text-ink-soft">Geen e-mailadres bekend</span>
          )}
        </Detail>
        <Detail label="Prijs">
          {appointment.priceCents === null
            ? "Nog niet bekend"
            : appointment.priceCents === 0
              ? "Gratis"
              : formatEuro(appointment.priceCents)}
          {(appointment.nailArtRequested || openPrices.length > 0) && (
            <span className="block text-small text-ink-soft">
              Exclusief {[...new Set(openPrices)].join(" en ").toLowerCase()} (in overleg)
            </span>
          )}
        </Detail>
        {options.length > 0 && (
          <Detail label="Extra" wide>
            <ul>
              {options.map((option) => (
                <li key={option.optionId}>
                  {option.name}
                  <span className="text-small text-ink-soft">
                    {" · "}
                    {option.priceCents !== null ? formatEuro(option.priceCents) : "prijs in overleg"}
                    {option.durationMinutes > 0 && ` · ${option.durationMinutes} min`}
                  </span>
                </li>
              ))}
            </ul>
          </Detail>
        )}
        {appointment.nailArtRequested && (
          <Detail label="Nail art" wide>
            <span className="whitespace-pre-line">{appointment.nailArtDescription ?? "Geen omschrijving"}</span>
          </Detail>
        )}
        {appointment.customerNotes && (
          <Detail label="Opmerking van de klant" wide>
            <span className="whitespace-pre-line">{appointment.customerNotes}</span>
          </Detail>
        )}
        <Detail label="Herkomst">
          {sourceLabels[appointment.source]}
          <span className="block text-small text-ink-soft">{formatMoment(appointment.createdAt)}</span>
        </Detail>
      </dl>

      {actions.length > 0 && (
        <AdminSection title="Wat wil je doen?">
          <div className="grid gap-8">
            {actions.includes("confirm") && (
              <div>
                <ActionForm action={changeStatusAction} submitLabel="Afspraak bevestigen">
                  <input type="hidden" name="id" value={appointment.id} />
                  <input type="hidden" name="actie" value="confirm" />
                </ActionForm>
                <p className="mt-3 max-w-xl text-small text-ink-soft">
                  De automatische bevestigingsmail komt er later bij. Laat het de klant voorlopig zelf weten.
                </p>
              </div>
            )}

            {(actions.includes("complete") || actions.includes("no_show")) && (
              <div className="flex flex-wrap gap-x-8 gap-y-4">
                {actions.includes("complete") && (
                  <ActionForm action={changeStatusAction} submitLabel="Geweest">
                    <input type="hidden" name="id" value={appointment.id} />
                    <input type="hidden" name="actie" value="complete" />
                  </ActionForm>
                )}
                {actions.includes("no_show") && (
                  <ActionForm action={changeStatusAction} submitLabel="Niet gekomen" quiet>
                    <input type="hidden" name="id" value={appointment.id} />
                    <input type="hidden" name="actie" value="no_show" />
                  </ActionForm>
                )}
              </div>
            )}

            {actions.includes("reschedule") && (
              <Fold title="Verplaatsen">
                <ActionForm action={rescheduleAction} submitLabel="Verplaatsen">
                  <input type="hidden" name="id" value={appointment.id} />
                  <div className="grid gap-6 sm:grid-cols-3">
                    <DateField name="date" label="Nieuwe datum" value={start.date} min={localDateString()} required />
                    <TimeField name="time" label="Begintijd" value={start.time} required />
                    <div>
                      <label htmlFor="duur" className="field-label">
                        Duur (minuten)
                      </label>
                      <input
                        id="duur"
                        name="duration"
                        inputMode="numeric"
                        defaultValue={appointment.durationMinutes}
                        required
                        className="field-input"
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <ForceCheckbox label="Toch inplannen, ook buiten mijn openingstijden of over een blokkade" />
                  </div>
                </ActionForm>
              </Fold>
            )}

            {actions.includes("reject") && (
              <Fold title="Afwijzen">
                <ActionForm action={changeStatusAction} submitLabel="Aanvraag afwijzen">
                  <input type="hidden" name="id" value={appointment.id} />
                  <input type="hidden" name="actie" value="reject" />
                  <TextArea name="note" label="Reden, voor jezelf (optioneel)" rows={2} />
                </ActionForm>
                <p className="mt-3 max-w-xl text-small text-ink-soft">
                  De klant krijgt hier nog geen automatisch bericht van, dus laat het zelf even weten.
                </p>
              </Fold>
            )}

            {actions.includes("cancel") && (
              <Fold title="Annuleren">
                <ActionForm action={changeStatusAction} submitLabel="Afspraak annuleren">
                  <input type="hidden" name="id" value={appointment.id} />
                  <input type="hidden" name="actie" value="cancel" />
                  <TextArea name="note" label="Reden, voor jezelf (optioneel)" rows={2} />
                </ActionForm>
              </Fold>
            )}
          </div>
        </AdminSection>
      )}

      {data.category === "extensions" && releaseVariants.length > 0 && (
        <ReleaseSection
          appointmentId={appointment.id}
          customerName={customer.name}
          releases={releases}
          variants={releaseVariants}
        />
      )}

      <AdminSection title="Notitie voor jezelf" intro="Alleen jij ziet dit, de klant niet.">
        <ActionForm action={saveNotesAction} submitLabel="Notitie opslaan">
          <input type="hidden" name="id" value={appointment.id} />
          <TextArea name="notes" label="Notitie" value={appointment.internalNotes ?? ""} />
        </ActionForm>
      </AdminSection>

      {history.length > 0 && (
        <AdminSection title={`Eerdere en andere afspraken van ${customer.name}`}>
          <ul className="border-t border-line-strong text-small">
            {history.map((item) => (
              <li key={item.id} className="border-b border-line">
                <Link
                  href={`/admin/afspraken/${item.id}`}
                  className="flex flex-wrap justify-between gap-x-6 py-3 hover:bg-ivory/60"
                >
                  <span>
                    {formatMoment(item.startAt)} · {item.treatmentName}
                  </span>
                  <span className="text-ink-soft">{statusLabels[item.status]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </AdminSection>
      )}

      <AdminSection title="Logboek">
        <ol className="border-t border-line-strong text-small">
          {events.map((event) => (
            <li key={event.id} className="grid gap-1 border-b border-line py-3 sm:grid-cols-[11rem_1fr]">
              <span className="text-ink-soft">{formatMoment(event.createdAt)}</span>
              <span>
                {event.fromStatus && event.fromStatus !== event.toStatus
                  ? `${statusLabels[event.fromStatus]} → ${statusLabels[event.toStatus]}`
                  : statusLabels[event.toStatus]}
                <span className="text-ink-soft"> · {actorLabels[event.actor]}</span>
                {event.note && <span className="block text-ink-soft">{event.note}</span>}
              </span>
            </li>
          ))}
        </ol>
      </AdminSection>
    </>
  );
}

function Detail({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-small text-ink-soft">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}

/** Ingeklapte actie, zodat afwijzen of annuleren niet per ongeluk gebeurt. */
function Fold({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group max-w-2xl border-t border-line pt-4">
      <summary className="cursor-pointer font-medium marker:text-ink-soft">{title}</summary>
      <div className="mt-6">{children}</div>
    </details>
  );
}
