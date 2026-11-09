import "server-only";
import nodemailer from "nodemailer";
import { site } from "@/config/site";
import type { Mail } from "@/lib/mail/templates";

/*
 * Eén adapter per mailprovider achter dezelfde interface
 * (docs/besluiten.md, E-mail). Nu alleen Gmail, via SMTP met een
 * app-wachtwoord. Een andere provider is een nieuwe adapter; de rest van de
 * app merkt daar niets van.
 */

export type OutgoingMail = Mail & { to: string; replyTo?: string };

export interface MailTransport {
  /** Controleert of inloggen lukt, zonder iets te versturen. */
  verify(): Promise<void>;
  send(mail: OutgoingMail): Promise<void>;
}

export function gmailTransport(address: string, appPassword: string): MailTransport {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: address, pass: appPassword },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return {
    async verify() {
      await transporter.verify();
    },
    async send(mail) {
      await transporter.sendMail({
        from: { name: site.name, address },
        to: mail.to,
        replyTo: mail.replyTo,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
    },
  };
}

type SmtpError = { code?: unknown; responseCode?: unknown };

const errorCode = (error: unknown) =>
  typeof error === "object" && error !== null ? (error as SmtpError) : {};

/** Inloggen geweigerd: het app-wachtwoord klopt niet (meer). */
export function isLoginError(error: unknown): boolean {
  const { code, responseCode } = errorCode(error);
  return code === "EAUTH" || code === "ENOAUTH" || responseCode === 535 || responseCode === 534;
}

/** De ontvanger bestaat niet of weigert. */
function isRecipientError(error: unknown): boolean {
  const { code, responseCode } = errorCode(error);
  return code === "EENVELOPE" || responseCode === 550 || responseCode === 553;
}

/** Foutmelding in gewone taal, zonder technische details of gegevens. */
export function friendlyMailError(error: unknown): string {
  if (isLoginError(error)) {
    return "Inloggen bij Gmail lukt niet meer. Is het app-wachtwoord ingetrokken? Koppel Gmail dan opnieuw.";
  }
  if (isRecipientError(error)) return "Het e-mailadres van de ontvanger bestaat niet of weigert de mail.";
  return "Gmail was even niet bereikbaar.";
}

/**
 * Alleen de foutcode voor de serverlog: de melding zelf kan een e-mailadres
 * bevatten, en die horen niet in de log.
 */
export function logCode(error: unknown): string {
  const { code, responseCode } = errorCode(error);
  return [code, responseCode].filter((part) => part !== undefined).join(" ") || "onbekend";
}
