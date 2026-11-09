import { connection } from "next/server";
import { syncCalendarIfStale } from "@/server/calendar/sync";

/*
 * Dagelijkse taak van Vercel (gratis, zie vercel.json): het vangnet voor de
 * iCloud-synchronisatie op rustige dagen. De gewone rondes lopen na
 * wijzigingen en bij bezoek aan de reserveerpagina of het beheer.
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
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
