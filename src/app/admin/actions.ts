"use server";

import { and, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  getDummyHash,
  hashPassword,
  passwordRules,
  verifyPassword,
} from "@/server/auth/password";
import { clientIp, isLoginBlocked, recordLoginAttempt } from "@/server/auth/rate-limit";
import {
  createSession,
  destroyOtherSessions,
  destroySession,
  requireAdmin,
} from "@/server/auth/session";
import { getDb } from "@/server/db";
import { adminUsers } from "@/server/db/schema";

/*
 * Server Actions zijn POST-verzoeken; Next.js weigert ze als de Origin niet
 * bij de host hoort (CSRF). Elke actie valideert zelf haar invoer en, waar
 * nodig, de sessie.
 */

export type FormState = { error?: string; success?: string; email?: string };

const loginSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(passwordRules.maxLength),
});

export async function login(_previous: FormState, formData: FormData): Promise<FormState> {
  const rawEmail = String(formData.get("email") ?? "").trim();
  const parsed = loginSchema.safeParse({ email: rawEmail, password: formData.get("password") });
  if (!parsed.success) {
    return { error: "Vul je e-mailadres en wachtwoord in.", email: rawEmail };
  }

  const email = parsed.data.email.toLowerCase();
  const ip = await clientIp();
  if (await isLoginBlocked(email, ip)) {
    return {
      error: "Te veel pogingen achter elkaar. Probeer het over 15 minuten opnieuw.",
      email: rawEmail,
    };
  }

  const [user] = await getDb()
    .select({ id: adminUsers.id, passwordHash: adminUsers.passwordHash })
    .from(adminUsers)
    .where(and(sql`lower(${adminUsers.email}) = ${email}`, eq(adminUsers.active, true)))
    .limit(1);

  // Ook zonder account een hash controleren: gelijke responstijd, geen hint of het adres bestaat.
  const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !valid) {
    await recordLoginAttempt(email, ip, false);
    return { error: "E-mailadres of wachtwoord klopt niet.", email: rawEmail };
  }

  await recordLoginAttempt(email, ip, true);
  await getDb().update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
  await createSession(user.id);
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/inloggen");
}

const changePasswordSchema = z
  .object({
    current: z.string().min(1).max(passwordRules.maxLength),
    next: z.string().min(passwordRules.minLength).max(passwordRules.maxLength),
    confirm: z.string(),
  })
  .refine((values) => values.next === values.confirm, { path: ["confirm"] });

export async function changePassword(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const parsed = changePasswordSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.path[0] === "confirm") return { error: "De twee nieuwe wachtwoorden zijn niet gelijk." };
    if (issue?.path[0] === "next") {
      return { error: `Kies een nieuw wachtwoord van minimaal ${passwordRules.minLength} tekens.` };
    }
    return { error: "Vul alle velden in." };
  }

  const [user] = await getDb()
    .select({ passwordHash: adminUsers.passwordHash })
    .from(adminUsers)
    .where(eq(adminUsers.id, admin.id))
    .limit(1);
  if (!user || !(await verifyPassword(parsed.data.current, user.passwordHash))) {
    return { error: "Je huidige wachtwoord klopt niet." };
  }

  await getDb()
    .update(adminUsers)
    .set({ passwordHash: await hashPassword(parsed.data.next) })
    .where(eq(adminUsers.id, admin.id));
  // Andere apparaten worden uitgelogd; deze sessie blijft actief.
  await destroyOtherSessions(admin.id);

  return { success: "Je wachtwoord is gewijzigd. Andere apparaten zijn uitgelogd." };
}
