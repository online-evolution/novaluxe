import { connection } from "next/server";
import { syncCalendarIfStale } from "@/server/calendar/sync";
import { deliverPendingMail } from "@/server/mail/service";

/*
 * Vaste taak van Vercel, elk kwartier (vercel.json, Pro-plan): houdt de
 * iCloud-agenda bij en verstuurt mails die nog weg moeten, ook als niemand de
 * site bezoekt. Daarnaast lopen rondes na wijzigingen en bij bezoek aan de
 * reserveerpagina of het beheer.
 *
 * Met CRON_SECRET in Vercel stuurt Vercel dat mee en is dit adres alleen
 * voor Vercel. Zonder CRON_SECRET kan iedereen het aanroepen; dat start dan
 * hooguit één ronde per vijf minuten.
 */
export const maxDuration = 60;

export async function GET(request: Request) {
  await connection();
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Niet toegestaan", { status: 401 });
  }
  await syncCalendarIfStale(5);
  await deliverPendingMail().catch(() => undefined);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
