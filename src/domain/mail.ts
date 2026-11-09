/*
 * Soorten mail en hun namen in het beheer. Puur, zodat beheerpagina's en de
 * server dezelfde woorden gebruiken.
 */

export type MailKind = "aanvraag" | "bericht" | "bevestiging" | "afwijzing" | "annulering" | "verplaatsing";
export type MailStatus = "wachtend" | "bezig" | "verzonden" | "mislukt" | "overgeslagen";

export const mailKindLabels: Record<MailKind, string> = {
  aanvraag: "Melding van een nieuwe aanvraag",
  bericht: "Melding van een nieuw bericht",
  bevestiging: "Bevestiging aan de klant",
  afwijzing: "Afwijzing aan de klant",
  annulering: "Annulering aan de klant",
  verplaatsing: "Nieuwe tijd aan de klant",
};

/** Mails aan de klant (de rest gaat naar Jessie). */
export const customerMailKinds: ReadonlySet<MailKind> = new Set([
  "bevestiging",
  "afwijzing",
  "annulering",
  "verplaatsing",
]);

/** De status die de afspraak moet hebben om de mail nog te laten kloppen. */
export const requiredAppointmentStatus = {
  aanvraag: "pending",
  bevestiging: "confirmed",
  verplaatsing: "confirmed",
  afwijzing: "rejected",
  annulering: "cancelled",
} as const satisfies Partial<Record<MailKind, string>>;

/** Klopt de mail nog bij de afspraak zoals die nu is? */
export function mailStillFits(kind: MailKind, appointmentStatus: string | null | undefined): boolean {
  if (kind === "bericht") return true;
  return appointmentStatus === requiredAppointmentStatus[kind];
}

export const mailStatusLabels: Record<MailStatus, string> = {
  wachtend: "Wordt verstuurd",
  bezig: "Wordt verstuurd",
  verzonden: "Verstuurd",
  mislukt: "Niet gelukt",
  overgeslagen: "Niet verstuurd",
};
