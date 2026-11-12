import "server-only";
import { and, desc, eq, gt, inArray, lt, or, sql } from "drizzle-orm";
import { customerMailKinds, requiredAppointmentStatus, type MailKind } from "@/domain/mail";
import {
  cancellationMail,
  confirmationMail,
  contactNotificationMail,
  rejectionMail,
  requestNotificationMail,
  rescheduleMail,
  testMail,
  type AppointmentDetails,
  type MailBrand,
} from "@/lib/mail/templates";
import { getDb } from "@/server/db";
import {
  appointmentOptions,
  appointments,
  contactMessages,
  customers,
  mailConnection,
  mailMessages,
} from "@/server/db/schema";
import { decryptSecret, encryptSecret } from "@/server/secret";
import { publicBaseUrl } from "@/server/site-url";

/** Het logo in mails: een kleine PNG uit public/brand, via het openbare adres. */
const mailBrand = (): MailBrand => ({ logoUrl: `${publicBaseUrl()}/brand/mail-logo.png` });
import {
  friendlyMailError,
  gmailTransport,
  isLoginError,
  logCode,
  type MailTransport,
  type OutgoingMail,
} from "./transport";

/*
 * De MailService (docs/besluiten.md, E-mail). De site mailt vanaf Jessies
 * eigen Gmail-adres, gekoppeld in het beheer met een app-wachtwoord dat
 * alleen versleuteld wordt bewaard.
 *
 * Elke mail krijgt eerst een regel in `mail_messages` en wordt daarna
 * verstuurd. Lukt dat niet, dan probeert de site het nog twee keer (bij het
 * openen van het beheer en met de vaste taak, elk kwartier), tot een dag na de
 * aanleiding. Inhoud en adres worden pas bij het versturen opgehaald, met een
 * controle of de mail nog klopt: een bevestiging voor een intussen
 * geannuleerde afspraak gaat niet meer weg.
 */

const purpose = "gmail-wachtwoord-v1";
const maxAttempts = 3;
const retryWindowHours = 24;
/** Een mail die langer "bezig" is, is blijven hangen en mag opnieuw. */
const stuckMinutes = 5;

export type MailRef = { appointmentId: string } | { contactMessageId: string };

/** Alleen wat het beheer mag zien: nooit het (versleutelde) wachtwoord. */
export type MailConnectionView = {
  address: string;
  notifyAddress: string | null;
  lastSentAt: Date | null;
  lastError: string | null;
};

async function getConnectionRow() {
  const [row] = await getDb().select().from(mailConnection).where(eq(mailConnection.id, 1)).limit(1);
  return row ?? null;
}

export async function getMailConnection(): Promise<MailConnectionView | null> {
  const row = await getConnectionRow();
  if (!row) return null;
  return {
    address: row.address,
    notifyAddress: row.notifyAddress,
    lastSentAt: row.lastSentAt,
    lastError: row.lastError,
  };
}

function transportFor(row: NonNullable<Awaited<ReturnType<typeof getConnectionRow>>>): MailTransport {
  return gmailTransport(row.address, decryptSecret(row.encryptedPassword, { purpose, account: row.address }));
}

const notifyTo = (row: { address: string; notifyAddress: string | null }) => row.notifyAddress ?? row.address;

/**
 * Koppelen: inloggen bij Gmail en een testmail naar het adres zelf sturen.
 * Pas als dat lukt, wordt het app-wachtwoord (versleuteld) opgeslagen.
 */
export async function connectMail(
  address: string,
  appPassword: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const transport = gmailTransport(address, appPassword);
  try {
    await transport.verify();
    await transport.send({ ...testMail(address, mailBrand()), to: address });
  } catch (error) {
    console.error("Gmail koppelen mislukt", logCode(error));
    return {
      ok: false,
      message: isLoginError(error)
        ? "Inloggen bij Gmail lukt niet. Controleer het Gmail-adres en gebruik een app-wachtwoord, niet je gewone wachtwoord."
        : "Gmail is nu niet bereikbaar. Probeer het over een paar minuten opnieuw.",
    };
  }

  const values = {
    address,
    encryptedPassword: encryptSecret(appPassword, { purpose, account: address }),
    lastSentAt: new Date(),
    lastError: null,
  };
  await getDb()
    .insert(mailConnection)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: mailConnection.id, set: { ...values, notifyAddress: null } });
  return { ok: true };
}

export async function disconnectMail(): Promise<void> {
  await getDb().delete(mailConnection).where(eq(mailConnection.id, 1));
}

export async function saveNotifyAddress(notifyAddress: string | null): Promise<void> {
  await getDb().update(mailConnection).set({ notifyAddress }).where(eq(mailConnection.id, 1));
}

/** Testmail naar het adres voor meldingen, om te zien of die aankomen. */
export async function sendTestMail(): Promise<{ ok: true; to: string } | { ok: false; message: string }> {
  const row = await getConnectionRow();
  if (!row) return { ok: false, message: "Gmail is niet gekoppeld." };
  const to = notifyTo(row);
  try {
    await transportFor(row).send({ ...testMail(row.address, mailBrand()), to });
  } catch (error) {
    console.error("Testmail mislukt", logCode(error));
    const message = friendlyMailError(error);
    if (isLoginError(error)) await setConnectionError(message);
    return { ok: false, message };
  }
  await getDb().update(mailConnection).set({ lastSentAt: new Date(), lastError: null }).where(eq(mailConnection.id, 1));
  return { ok: true, to };
}

async function setConnectionError(message: string | null) {
  await getDb().update(mailConnection).set({ lastError: message }).where(eq(mailConnection.id, 1));
}

/**
 * Een mail klaarzetten. Zonder koppeling gaan meldingen voor Jessie
 * nergens heen (ze ziet alles in het beheer); een mail aan de klant krijgt
 * dan een regel "niet verstuurd", zodat het beheer kan zeggen dat Jessie de
 * klant zelf moet inlichten. Geeft het id terug als er iets te versturen is.
 */
export async function queueMail(kind: MailKind, ref: MailRef): Promise<string | null> {
  const connected = (await getConnectionRow()) !== null;
  if (!connected && !customerMailKinds.has(kind)) return null;
  const [row] = await getDb()
    .insert(mailMessages)
    .values({
      kind,
      ...ref,
      ...(connected ? {} : { status: "overgeslagen" as const, error: "Gmail is niet gekoppeld." }),
    })
    .returning({ id: mailMessages.id });
  return connected ? row!.id : null;
}

/** Klaarzetten en meteen versturen; voor het beheer, zodat Jessie direct ziet of het lukte. */
export async function sendMailNow(kind: MailKind, ref: MailRef): Promise<void> {
  const id = await queueMail(kind, ref).catch((error: unknown) => {
    console.error("Mail klaarzetten mislukt", error instanceof Error ? error.message : error);
    return null;
  });
  if (id) await deliverMail(id);
}

type Built = { mail: OutgoingMail } | { skip: string };

async function buildMail(
  message: typeof mailMessages.$inferSelect,
  connection: { address: string; notifyAddress: string | null },
): Promise<Built> {
  const db = getDb();
  const base = publicBaseUrl();

  if (message.kind === "bericht") {
    if (!message.contactMessageId) return { skip: "Het bericht bestaat niet meer." };
    const [contact] = await db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.id, message.contactMessageId))
      .limit(1);
    if (!contact) return { skip: "Het bericht bestaat niet meer." };
    return {
      mail: {
        ...contactNotificationMail(contact, `${base}/admin/berichten`, mailBrand()),
        to: notifyTo(connection),
        replyTo: contact.email ?? undefined,
      },
    };
  }

  if (!message.appointmentId) return { skip: "De afspraak bestaat niet meer." };
  const [row] = await db
    .select({ appointment: appointments, customer: customers })
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .where(eq(appointments.id, message.appointmentId))
    .limit(1);
  if (!row) return { skip: "De afspraak bestaat niet meer." };
  const { appointment, customer } = row;

  const pendingExpired =
    appointment.status === "pending" && appointment.expiresAt !== null && appointment.expiresAt <= new Date();
  if (appointment.status !== requiredAppointmentStatus[message.kind] || (message.kind === "aanvraag" && pendingExpired)) {
    return { skip: "De afspraak is intussen gewijzigd." };
  }

  const options = await db
    .select({ name: appointmentOptions.name, priceCents: appointmentOptions.priceCents })
    .from(appointmentOptions)
    .where(eq(appointmentOptions.appointmentId, appointment.id));

  const details: AppointmentDetails = {
    customerName: customer.name,
    treatmentName: appointment.treatmentName,
    variantLabel: appointment.variantLabel,
    startAt: appointment.startAt,
    endAt: appointment.endAt,
    priceCents: appointment.priceCents,
    openPriceNames: options.filter((option) => option.priceCents === null).map((option) => option.name),
  };

  if (message.kind === "aanvraag") {
    return {
      mail: {
        ...requestNotificationMail(
          {
            ...details,
            phone: customer.phone,
            email: customer.email,
            options: options.map((option) => option.name),
            nailArtDescription: appointment.nailArtRequested ? appointment.nailArtDescription : null,
            customerNotes: appointment.customerNotes,
            expiresAt: appointment.expiresAt,
          },
          `${base}/admin/afspraken/${appointment.id}`,
          mailBrand(),
        ),
        to: notifyTo(connection),
        replyTo: customer.email ?? undefined,
      },
    };
  }

  if (!customer.email) return { skip: "Er is geen e-mailadres van de klant bekend." };
  const bookingUrl = `${base}/reserveren`;
  const content =
    message.kind === "bevestiging"
      ? confirmationMail(details, mailBrand())
      : message.kind === "verplaatsing"
        ? rescheduleMail(details, mailBrand())
        : message.kind === "afwijzing"
          ? rejectionMail(details, bookingUrl, mailBrand())
          : cancellationMail(details, bookingUrl, mailBrand());
  return { mail: { ...content, to: customer.email } };
}

/** Eén mail versturen. Gooit nooit: het resultaat staat in `mail_messages`. */
export async function deliverMail(id: string): Promise<void> {
  const db = getDb();
  try {
    // Claimen, zodat dezelfde mail nooit twee keer tegelijk vertrekt.
    const [message] = await db
      .update(mailMessages)
      .set({ status: "bezig", attempts: sql`${mailMessages.attempts} + 1` })
      .where(
        and(
          eq(mailMessages.id, id),
          or(
            inArray(mailMessages.status, ["wachtend", "mislukt"]),
            and(
              eq(mailMessages.status, "bezig"),
              lt(mailMessages.updatedAt, new Date(Date.now() - stuckMinutes * 60 * 1000)),
            ),
          ),
        ),
      )
      .returning();
    if (!message) return;

    const finish = (values: Partial<typeof mailMessages.$inferInsert>) =>
      db.update(mailMessages).set(values).where(eq(mailMessages.id, id));

    const connection = await getConnectionRow();
    if (!connection) {
      await finish({ status: "overgeslagen", error: "Gmail is niet gekoppeld." });
      return;
    }

    const built = await buildMail(message, connection);
    if ("skip" in built) {
      await finish({ status: "overgeslagen", error: built.skip });
      return;
    }

    try {
      await transportFor(connection).send(built.mail);
    } catch (error) {
      console.error("Mail versturen mislukt", message.kind, logCode(error));
      const friendly = friendlyMailError(error);
      await finish({ status: "mislukt", error: friendly });
      if (isLoginError(error)) await setConnectionError(friendly);
      return;
    }

    await finish({ status: "verzonden", error: null, sentAt: new Date() });
    await db.update(mailConnection).set({ lastSentAt: new Date(), lastError: null }).where(eq(mailConnection.id, 1));
  } catch (error) {
    // Database of ontsleutelen: de mail blijft staan voor een volgende poging.
    console.error("Mail afhandelen mislukt", error instanceof Error ? error.message : error);
    await db
      .update(mailMessages)
      .set({ status: "mislukt", error: "Er ging iets mis bij het versturen." })
      .where(and(eq(mailMessages.id, id), eq(mailMessages.status, "bezig")))
      .catch(() => undefined);
  }
}

/** Mails die nog weg moeten of een nieuwe poging verdienen. */
export async function deliverPendingMail(): Promise<void> {
  const connection = await getConnectionRow();
  // Bij een geweigerd app-wachtwoord niet steeds opnieuw inloggen (dat maakt
  // Google wantrouwig); pas weer na opnieuw koppelen of een gelukte testmail.
  if (!connection || connection.lastError) return;
  const now = Date.now();
  const rows = await getDb()
    .select({ id: mailMessages.id })
    .from(mailMessages)
    .where(
      and(
        lt(mailMessages.attempts, maxAttempts),
        gt(mailMessages.createdAt, new Date(now - retryWindowHours * 60 * 60 * 1000)),
        or(
          inArray(mailMessages.status, ["wachtend", "mislukt"]),
          and(eq(mailMessages.status, "bezig"), lt(mailMessages.updatedAt, new Date(now - stuckMinutes * 60 * 1000))),
        ),
      ),
    )
    .orderBy(mailMessages.createdAt)
    .limit(20);
  for (const row of rows) await deliverMail(row.id);
}

/** Opnieuw proberen vanuit het beheer, ook als Gmail eerder niet gekoppeld was. */
export async function retryMail(id: string) {
  const db = getDb();
  const [row] = await db
    .update(mailMessages)
    .set({ status: "wachtend", attempts: 0, error: null })
    .where(and(eq(mailMessages.id, id), inArray(mailMessages.status, ["mislukt", "overgeslagen"])))
    .returning({ id: mailMessages.id });
  if (row) await deliverMail(row.id);
  const [result] = await db
    .select({ status: mailMessages.status, error: mailMessages.error })
    .from(mailMessages)
    .where(eq(mailMessages.id, id))
    .limit(1);
  return result ?? null;
}

export async function listMailsForAppointment(appointmentId: string) {
  return getDb()
    .select()
    .from(mailMessages)
    .where(eq(mailMessages.appointmentId, appointmentId))
    .orderBy(mailMessages.createdAt);
}

/** De laatste mails, met een naam erbij, voor Beheer → E-mail. */
export async function listRecentMails(limit = 30) {
  return getDb()
    .select({
      id: mailMessages.id,
      kind: mailMessages.kind,
      status: mailMessages.status,
      error: mailMessages.error,
      sentAt: mailMessages.sentAt,
      createdAt: mailMessages.createdAt,
      appointmentId: mailMessages.appointmentId,
      appointmentStatus: appointments.status,
      customerName: customers.name,
      contactName: contactMessages.name,
    })
    .from(mailMessages)
    .leftJoin(appointments, eq(mailMessages.appointmentId, appointments.id))
    .leftJoin(customers, eq(appointments.customerId, customers.id))
    .leftJoin(contactMessages, eq(mailMessages.contactMessageId, contactMessages.id))
    .orderBy(desc(mailMessages.createdAt))
    .limit(limit);
}

/** Mislukte mails van de afgelopen week, voor de teller in het menu. */
export async function countFailedMails(): Promise<number> {
  const [row] = await getDb()
    .select({ total: sql<number>`count(*)::int` })
    .from(mailMessages)
    .where(
      and(
        eq(mailMessages.status, "mislukt"),
        gt(mailMessages.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
      ),
    );
  return row?.total ?? 0;
}
