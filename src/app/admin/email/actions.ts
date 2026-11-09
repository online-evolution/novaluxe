"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/components/admin/action-form";
import { clientIp } from "@/server/auth/rate-limit";
import { requireAdmin } from "@/server/auth/session";
import {
  connectMail,
  disconnectMail,
  getMailConnection,
  retryMail,
  saveNotifyAddress,
  sendTestMail,
} from "@/server/mail/service";
import { takeToken } from "@/server/rate-limit";

const reload = "Er ging iets mis. Laad de pagina opnieuw.";

const credentials = z.object({
  address: z.email("Vul je Gmail-adres in."),
  // Google toont het als vier groepjes van vier letters met spaties.
  password: z
    .string()
    .transform((value) => value.toLowerCase().replace(/[\s-]/g, ""))
    .refine((value) => /^[a-z]{16}$/.test(value), "Vul het app-wachtwoord in: 16 letters, zoals abcd efgh ijkl mnop."),
});

/** Koppelen. Het app-wachtwoord wordt alleen versleuteld opgeslagen en nooit teruggestuurd. */
export async function connectMailAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = credentials.safeParse({
    address: String(formData.get("address") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? reload };
  if (!(await takeToken("gmail-koppelen", await clientIp(), { limit: 10, windowMinutes: 60 }))) {
    return { error: "Je hebt het vaak geprobeerd. Probeer het over een uur opnieuw." };
  }

  const result = await connectMail(parsed.data.address, parsed.data.password);
  if (!result.ok) return { error: result.message };
  refresh();
  return { success: "Gekoppeld. Er staat een testmail in je inbox." };
}

export async function testMailAction(): Promise<ActionState> {
  await requireAdmin();
  if (!(await takeToken("gmail-test", await clientIp(), { limit: 10, windowMinutes: 60 }))) {
    return { error: "Je hebt al veel testmails gestuurd. Probeer het over een uur opnieuw." };
  }
  const result = await sendTestMail();
  refresh();
  return result.ok ? { success: `Testmail verstuurd naar ${result.to}.` } : { error: result.message };
}

export async function notifyAddressAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const raw = String(formData.get("notifyAddress") ?? "").trim().toLowerCase();
  const parsed = z.union([z.literal(""), z.email()]).safeParse(raw);
  if (!parsed.success) return { error: "Dit e-mailadres klopt niet. Laat het leeg voor je Gmail-adres." };
  const connection = await getMailConnection();
  if (!connection) return { error: reload };
  await saveNotifyAddress(parsed.data === "" || parsed.data === connection.address ? null : parsed.data);
  refresh();
  return { success: "Opgeslagen." };
}

export async function disconnectMailAction(): Promise<ActionState> {
  await requireAdmin();
  await disconnectMail();
  refresh();
  return { success: "Ontkoppeld." };
}

/** Een mislukte of niet verstuurde mail alsnog versturen. */
export async function retryMailAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = z.uuid().safeParse(formData.get("mailId"));
  if (!id.success) return { error: reload };
  const result = await retryMail(id.data);
  refresh();
  if (result?.status === "verzonden") return { success: "Verstuurd." };
  return { error: result?.error ?? "Versturen is niet gelukt." };
}

