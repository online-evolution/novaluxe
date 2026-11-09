import type { Metadata } from "next";
import { Suspense } from "react";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader, AdminSection, Loading } from "@/components/admin/admin-page";
import { MailList } from "@/components/admin/mail-list";
import { formatMoment } from "@/lib/time";
import { requireAdmin } from "@/server/auth/session";
import { getMailConnection, listRecentMails, type MailConnectionView } from "@/server/mail/service";
import { connectMailAction, disconnectMailAction, notifyAddressAction, testMailAction } from "./actions";

export const metadata: Metadata = { title: "E-mail" };

/** Koppelen en testen praten met Gmail; meer tijd dan een gewone pagina. */
export const maxDuration = 60;

/*
 * De koppeling met Jessies Gmail (docs/besluiten.md, E-mail). Zonder
 * koppeling: uitleg en een formulier. Met koppeling: status, testmail, waar
 * meldingen heen gaan, de laatste mails, en ontkoppelen.
 */
export default function EmailPage() {
  return (
    <>
      <AdminPageHeader
        title="E-mail"
        intro="Koppel je Gmail: klanten krijgen dan automatisch mail van jouw adres als je een afspraak bevestigt, en jij krijgt een melding bij een nieuwe aanvraag of een nieuw bericht."
      />
      <Suspense fallback={<Loading />}>
        <EmailContent />
      </Suspense>
    </>
  );
}

async function EmailContent() {
  await requireAdmin();
  const connection = await getMailConnection();
  return connection ? <Connected connection={connection} /> : <NotConnected />;
}

const external = "underline underline-offset-4 hover:text-bronze-deep";

function NotConnected() {
  return (
    <AdminSection title="Zo koppel je je Gmail" id="koppelen">
      <ol className="grid list-decimal gap-3 pl-5">
        <li>
          Ga naar{" "}
          <a href="https://myaccount.google.com/signinoptions/twosv" target="_blank" rel="noopener noreferrer" className={external}>
            Verificatie in 2 stappen <span className="sr-only">(opent in een nieuw venster)</span>
          </a>{" "}
          in je Google-account en zet het aan, als dat nog niet zo is.
        </li>
        <li>
          Ga naar{" "}
          <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className={external}>
            App-wachtwoorden <span className="sr-only">(opent in een nieuw venster)</span>
          </a>
          , typ als naam “NovaLuxe” en klik op <strong className="font-medium">Maken</strong>. Je krijgt een code van 16
          letters, zoals <span className="figures">abcd efgh ijkl mnop</span>.
        </li>
        <li>Vul hieronder je Gmail-adres en die code in en klik op Koppelen. Je krijgt meteen een testmail.</li>
      </ol>
      <p className="mt-4 text-small text-ink-soft">
        De code wordt versleuteld bewaard en nooit meer getoond. Je kunt hem altijd intrekken bij Google; dan stopt het
        mailen. NovaLuxe gebruikt de code alleen om te versturen, en leest nooit je mail.
      </p>
      <ActionForm action={connectMailAction} submitLabel="Koppelen" className="mt-8 grid max-w-xl gap-6">
        <div>
          <label htmlFor="gmail-adres" className="field-label">
            Gmail-adres
          </label>
          <input id="gmail-adres" name="address" type="email" autoComplete="off" required className="field-input" />
        </div>
        <div>
          <label htmlFor="gmail-code" className="field-label">
            App-wachtwoord
          </label>
          <input
            id="gmail-code"
            name="password"
            type="password"
            autoComplete="off"
            placeholder="abcd efgh ijkl mnop"
            required
            className="field-input"
          />
        </div>
      </ActionForm>
    </AdminSection>
  );
}

async function Connected({ connection }: { connection: MailConnectionView }) {
  const mails = await listRecentMails();

  return (
    <>
      <AdminSection title="Status" id="status">
        <p>
          Gekoppeld met <strong className="font-medium">{connection.address}</strong>. Klanten krijgen mail van dit adres,
          en als ze antwoorden, komt dat gewoon in je inbox.
        </p>
        {connection.lastSentAt && (
          <p className="mt-2 text-ink-soft">Laatst verstuurd: {formatMoment(connection.lastSentAt)}.</p>
        )}
        {connection.lastError && (
          <p role="alert" className="form-message mt-4 text-alert">
            {connection.lastError}
          </p>
        )}
        <ActionForm action={testMailAction} submitLabel="Stuur een testmail" />
      </AdminSection>

      <AdminSection
        title="Meldingen voor jou"
        intro="Bij een nieuwe aanvraag of een nieuw bericht krijg je een mail. Laat het veld leeg om ze op je Gmail-adres te krijgen."
        id="meldingen"
      >
        <ActionForm action={notifyAddressAction} submitLabel="Opslaan" className="grid max-w-xl gap-6">
          <div>
            <label htmlFor="melding-adres" className="field-label">
              Meldingen sturen naar
            </label>
            <input
              id="melding-adres"
              name="notifyAddress"
              type="email"
              autoComplete="off"
              defaultValue={connection.notifyAddress ?? ""}
              placeholder={connection.address}
              className="field-input"
            />
          </div>
        </ActionForm>
      </AdminSection>

      <AdminSection title="Laatste mails" id="mails">
        {mails.length === 0 ? (
          <p className="text-ink-soft">Er zijn nog geen mails verstuurd.</p>
        ) : (
          <MailList
            canRetry
            mails={mails.map((mail) => ({ ...mail, name: mail.customerName ?? mail.contactName }))}
          />
        )}
      </AdminSection>

      <AdminSection title="Ontkoppelen" id="ontkoppelen">
        <p className="text-ink-soft">
          Het opgeslagen app-wachtwoord wordt gewist en de site stuurt geen mail meer. Trek de code ook in bij Google als
          je hem niet meer gebruikt.
        </p>
        <ActionForm action={disconnectMailAction} submitLabel="Ontkoppelen" quiet />
      </AdminSection>
    </>
  );
}
