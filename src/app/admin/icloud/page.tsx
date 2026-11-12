import type { Metadata } from "next";
import { Suspense } from "react";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader, AdminSection, Loading } from "@/components/admin/admin-page";
import { IcloudTestForm } from "@/components/admin/icloud-test-form";
import { formatMoment } from "@/lib/time";
import { requireAdmin } from "@/server/auth/session";
import { getConnection, listCalendarChoices, listDrifts, novaluxeCalendarName } from "@/server/calendar/sync";
import {
  connectAction,
  disconnectAction,
  resolveDriftAction,
  saveBusyAction,
  syncNowAction,
} from "./actions";

export const metadata: Metadata = { title: "iCloud-agenda" };

/** Koppelen en "Nu synchroniseren" praten met iCloud; meer tijd dan een gewone pagina. */
export const maxDuration = 60;

/*
 * De koppeling met Jessies iCloud-agenda (docs/besluiten.md, iCloud). Zonder
 * koppeling: uitleg en een formulier. Met koppeling: status, afwijkingen op
 * de iPhone, welke agenda's meetellen als bezet, en ontkoppelen.
 */
export default function IcloudPage() {
  return (
    <>
      <AdminPageHeader
        title="iCloud-agenda"
        intro="Koppel je iCloud-agenda: bevestigde afspraken komen dan vanzelf op je iPhone, en tijden die je in je eigen agenda bezet hebt, zijn online niet te boeken."
      />
      <Suspense fallback={<Loading />}>
        <IcloudContent />
      </Suspense>
    </>
  );
}

async function IcloudContent() {
  await requireAdmin();
  const connection = await getConnection();
  return connection ? <Connected connection={connection} /> : <NotConnected />;
}

function NotConnected() {
  return (
    <>
      <AdminSection title="Zo koppel je je agenda" id="koppelen">
        <ol className="grid list-decimal gap-3 pl-5">
          <li>
            Ga naar{" "}
            <a
              href="https://account.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-bronze-deep"
            >
              account.apple.com <span className="sr-only">(opent in een nieuw venster)</span>
            </a>{" "}
            en log in met je Apple ID.
          </li>
          <li>
            Kies <strong className="font-medium">Inloggen en beveiliging</strong> en dan{" "}
            <strong className="font-medium">App-specifieke wachtwoorden</strong>. Maak er een aan met de naam “NovaLuxe”.
            Je krijgt een code als <span className="figures">abcd-efgh-ijkl-mnop</span>.
          </li>
          <li>Vul hieronder je Apple ID en die code in en klik op Koppelen.</li>
        </ol>
        <p className="mt-4 text-small text-ink-soft">
          De code wordt versleuteld bewaard en nooit meer getoond. Je kunt hem altijd intrekken bij Apple; dan stopt de
          koppeling. NovaLuxe maakt in je iCloud een agenda “{novaluxeCalendarName}” voor de afspraken. Uit je andere
          agenda’s leest NovaLuxe alleen wanneer je bezet bent, nooit wat er staat.
        </p>
        <ActionForm action={connectAction} submitLabel="Koppelen" className="mt-8 grid max-w-xl gap-6">
          <div>
            <label htmlFor="koppel-id" className="field-label">
              Apple ID (e-mailadres)
            </label>
            <input id="koppel-id" name="username" type="email" autoComplete="off" required className="field-input" />
          </div>
          <div>
            <label htmlFor="koppel-wachtwoord" className="field-label">
              App-specifiek wachtwoord
            </label>
            <input
              id="koppel-wachtwoord"
              name="password"
              type="password"
              autoComplete="off"
              placeholder="abcd-efgh-ijkl-mnop"
              required
              className="field-input"
            />
          </div>
        </ActionForm>
      </AdminSection>

      <TestSection />
    </>
  );
}

async function Connected({ connection }: { connection: NonNullable<Awaited<ReturnType<typeof getConnection>>> }) {
  const drifts = await listDrifts();

  return (
    <>
      <AdminSection title="Status" id="status">
        <p>
          Gekoppeld met <strong className="font-medium">{connection.appleId}</strong>. Bevestigde afspraken staan in de
          agenda “{novaluxeCalendarName}”.
        </p>
        <p className="mt-2 text-ink-soft">
          {connection.lastSyncAt
            ? `Laatst bijgewerkt: ${formatMoment(connection.lastSyncAt)}.`
            : "Nog niet bijgewerkt; dat gebeurt binnen een paar minuten."}{" "}
          NovaLuxe werkt de agenda bij na elke wijziging, en als iemand reserveert of jij het beheer opent.
        </p>
        {connection.lastError && (
          <p role="alert" className="form-message mt-4 text-alert">
            {connection.lastError}
          </p>
        )}
        <ActionForm action={syncNowAction} submitLabel="Nu bijwerken" />
      </AdminSection>

      <AdminSection title="Afwijkingen op je iPhone" id="afwijkingen">
        {drifts.length === 0 ? (
          <p className="text-ink-soft">Geen afwijkingen: je iPhone-agenda en NovaLuxe zijn gelijk.</p>
        ) : (
          <>
            <p className="text-ink-soft">
              Deze afspraken heb je op je iPhone verplaatst of verwijderd. NovaLuxe neemt dat niet vanzelf over: kies per
              afspraak wat er moet gebeuren.
            </p>
            <ul className="mt-6 grid gap-4">
              {drifts.map((drift) => (
                <li key={drift.appointmentId} className="border border-bronze bg-ivory p-5">
                  <p className="font-medium">
                    {drift.customerName} · {drift.treatmentName}
                  </p>
                  <p className="mt-1 text-small text-ink-soft">
                    In NovaLuxe: <span className="figures">{formatMoment(drift.startAt)}</span>.{" "}
                    {drift.drift === "verwijderd" ? (
                      "Op je iPhone verwijderd."
                    ) : (
                      <>
                        Op je iPhone verplaatst naar{" "}
                        <span className="figures">{drift.remoteStartAt ? formatMoment(drift.remoteStartAt) : "?"}</span>.
                      </>
                    )}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
                    <ActionForm
                      action={resolveDriftAction}
                      submitLabel={drift.drift === "verwijderd" ? "Afspraak annuleren" : "Tijd van iPhone overnemen"}
                      quiet
                    >
                      <input type="hidden" name="id" value={drift.appointmentId} />
                      <input type="hidden" name="keuze" value={drift.drift === "verwijderd" ? "annuleren" : "iphone"} />
                    </ActionForm>
                    <ActionForm action={resolveDriftAction} submitLabel="Terugzetten op je iPhone" quiet>
                      <input type="hidden" name="id" value={drift.appointmentId} />
                      <input type="hidden" name="keuze" value="terug" />
                    </ActionForm>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </AdminSection>

      <AdminSection
        title="Welke agenda’s tellen mee als bezet"
        intro="Tijden in deze agenda’s zijn online niet te boeken. NovaLuxe neemt van elke afspraak de tijd en de titel over, zodat je ze ook in het beheer ziet. Notities, locatie en genodigden worden niet gelezen."
        id="agendas"
      >
        <Suspense fallback={<Loading />}>
          <BusyCalendars />
        </Suspense>
      </AdminSection>

      <AdminSection title="Ontkoppelen" id="ontkoppelen">
        <p className="text-ink-soft">
          Het opgeslagen wachtwoord en de bezette tijden worden gewist. De afspraken in de agenda “{novaluxeCalendarName}”
          blijven op je iPhone staan. Trek ook de code in bij Apple als je hem niet meer gebruikt.
        </p>
        <ActionForm action={disconnectAction} submitLabel="Ontkoppelen" quiet />
      </AdminSection>
    </>
  );
}

async function BusyCalendars() {
  const choices = await listCalendarChoices().catch(() => null);
  if (!choices) {
    return <p className="text-alert">De agenda’s konden niet worden opgehaald uit iCloud. Probeer het later opnieuw.</p>;
  }
  if (choices.length === 0) return <p className="text-ink-soft">Er zijn geen andere agenda’s in deze iCloud-account.</p>;
  return (
    <ActionForm action={saveBusyAction} submitLabel="Opslaan">
      <fieldset>
        <legend className="sr-only">Agenda’s die meetellen als bezet</legend>
        <ul className="grid gap-3">
          {choices.map((choice) => (
            <li key={choice.url}>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="agenda"
                  value={choice.url}
                  defaultChecked={choice.busy}
                  className="size-5 accent-bronze-deep"
                />
                {choice.name}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
    </ActionForm>
  );
}

function TestSection() {
  return (
    <details className="mt-14 max-w-3xl">
      <summary className="cursor-pointer font-medium">Eerst alleen testen, zonder te koppelen</summary>
      <p className="mt-4 text-small text-ink-soft">
        De test maakt een agenda “NovaLuxe spike” met een paar testafspraken, controleert ze en verwijdert ze weer. Er wordt
        niets opgeslagen.
      </p>
      <div className="mt-6">
        <IcloudTestForm />
      </div>
    </details>
  );
}
