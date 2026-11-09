import Link from "next/link";
import { retryMailAction } from "@/app/admin/email/actions";
import { ActionForm } from "@/components/admin/action-form";
import { customerMailKinds, mailKindLabels, mailStillFits, mailStatusLabels, type MailKind, type MailStatus } from "@/domain/mail";
import { formatMoment } from "@/lib/time";

const notConnected = "Gmail is niet gekoppeld.";
const changed = "De afspraak is intussen gewijzigd.";

export type MailListItem = {
  id: string;
  kind: MailKind;
  status: MailStatus;
  error: string | null;
  sentAt: Date | null;
  createdAt: Date;
  appointmentId?: string | null;
  /** Huidige status van de afspraak: past de mail daar nog bij? */
  appointmentStatus?: string | null;
  /** Klant of afzender van het bericht, voor het overzicht op Beheer → E-mail. */
  name?: string | null;
};

/**
 * Welke mails er zijn verstuurd, en welke niet. Een mislukte of niet
 * verstuurde mail kan Jessie alsnog versturen (als Gmail gekoppeld is).
 */
export function MailList({ mails, canRetry }: { mails: MailListItem[]; canRetry: boolean }) {
  return (
    <ul className="border-t border-line-strong text-small">
      {mails.map((mail) => {
        const failed = mail.status === "mislukt" || mail.status === "overgeslagen";
        // Alleen opnieuw als dat iets kan veranderen (niet bij een gewijzigde afspraak of zonder adres).
        const fits = mailStillFits(mail.kind, mail.appointmentStatus);
        const retryable = fits && (mail.status === "mislukt" || mail.error === notConnected);
        return (
          <li key={mail.id} className="grid gap-2 border-b border-line py-3 sm:grid-cols-[1fr_auto] sm:items-start">
            <div>
              <p>
                {mailKindLabels[mail.kind]}
                {mail.name &&
                  (mail.appointmentId ? (
                    <>
                      {" · "}
                      <Link href={`/admin/afspraken/${mail.appointmentId}`} className="underline underline-offset-4">
                        {mail.name}
                      </Link>
                    </>
                  ) : (
                    ` · ${mail.name}`
                  ))}
              </p>
              <p className={failed ? "text-alert" : "text-ink-soft"}>
                {mailStatusLabels[mail.status]}
                {mail.status === "verzonden" && mail.sentAt ? `, ${formatMoment(mail.sentAt)}` : ""}
                {failed && mail.error ? `: ${mail.error}` : ""}
                {failed && customerMailKinds.has(mail.kind) && !(retryable && canRetry) && fits && mail.error !== changed
                  ? " Laat het de klant zelf weten."
                  : ""}
              </p>
            </div>
            {retryable && canRetry && (
              <ActionForm action={retryMailAction} submitLabel="Alsnog versturen" quiet>
                <input type="hidden" name="mailId" value={mail.id} />
              </ActionForm>
            )}
          </li>
        );
      })}
    </ul>
  );
}
