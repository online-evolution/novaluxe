"use server";

import { z } from "zod";
import { clientIp } from "@/server/auth/rate-limit";
import { requireAdmin } from "@/server/auth/session";
import { runIcloudSpike, type SpikeReport } from "@/server/icloud-spike";
import { takeToken } from "@/server/rate-limit";

export type IcloudTestState = {
  error?: string;
  report?: SpikeReport;
};

const schema = z.object({
  username: z.email("Vul het Apple ID in (een e-mailadres)."),
  // Apple toont het als vier groepjes van vier letters met streepjes.
  password: z
    .string()
    .transform((value) => value.trim().toLowerCase().replace(/[\s-]/g, ""))
    .refine((value) => /^[a-z]{16}$/.test(value), "Vul het app-specifieke wachtwoord in, zoals abcd-efgh-ijkl-mnop.")
    .transform((value) => value.match(/.{4}/g)!.join("-")),
});

/**
 * Draait de iCloud-spike met de ingevulde gegevens. Er wordt niets
 * opgeslagen: de gegevens bestaan alleen tijdens deze aanvraag en komen
 * nooit in een log of in het antwoord.
 */
export async function testIcloudAction(_previous: IcloudTestState, formData: FormData): Promise<IcloudTestState> {
  await requireAdmin();

  const parsed = schema.safeParse({
    username: String(formData.get("username") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Controleer de gegevens." };

  if (!(await takeToken("icloud-test", await clientIp(), { limit: 10, windowMinutes: 60 }))) {
    return { error: "Je hebt de test vaak gedraaid. Probeer het over een uur opnieuw." };
  }

  const report = await runIcloudSpike({
    username: parsed.data.username,
    password: parsed.data.password,
    readOnly: formData.get("alleenLezen") === "ja",
  });
  return { report };
}
