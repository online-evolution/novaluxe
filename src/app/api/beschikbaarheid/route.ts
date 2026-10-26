import { connection, type NextRequest } from "next/server";
import { z } from "zod";
import { quote, validateChoice } from "@/domain/booking";
import { getAvailability } from "@/server/booking/availability";
import { getCatalog } from "@/server/catalog";
import { getSettings } from "@/server/settings";

/*
 * Vrije tijden voor een gekozen behandeling, berekend op de server. De browser
 * toont ze alleen; bij het versturen wordt de tijd opnieuw gecontroleerd.
 *
 *   GET /api/beschikbaarheid?variant=<id>&opties=<id,id>&nailart=1
 */
const query = z.object({
  variant: z.uuid(),
  opties: z
    .string()
    .optional()
    .transform((value) => (value ? value.split(",").filter(Boolean) : [])),
  nailart: z.enum(["0", "1"]).optional(),
});

export async function GET(request: NextRequest) {
  await connection();
  const parsed = query.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return problem(400, "Ongeldige keuze.");

  const [catalog, settings] = await Promise.all([getCatalog(), getSettings()]);
  const treatment = catalog.find((item) => item.variants.some((variant) => variant.id === parsed.data.variant));
  const variant = treatment?.variants.find((item) => item.id === parsed.data.variant);
  if (!treatment || !variant) return problem(404, "Deze behandeling bestaat niet (meer).");

  const checked = validateChoice({
    treatment,
    variant,
    optionIds: parsed.data.opties,
    nailArt: parsed.data.nailart === "1",
  });
  if (!checked.ok) return problem(422, "Deze keuze is niet online aan te vragen.");

  const { durationMinutes } = quote(checked.choice, settings.nailArtDefaultBufferMinutes);
  const days = await getAvailability(durationMinutes);
  return Response.json({ durationMinutes, days }, { headers: { "Cache-Control": "no-store" } });
}

function problem(status: number, message: string) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}
