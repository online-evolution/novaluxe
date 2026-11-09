"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/components/admin/action-form";
import { requireAdmin } from "@/server/auth/session";
import { deleteContactMessage, setMessageRead } from "@/server/contact";

const reload = "Er ging iets mis. Laad de pagina opnieuw.";

export async function setMessageReadAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: reload };
  await setMessageRead(id.data, formData.get("gelezen") === "ja");
  refresh();
  return {};
}

export async function deleteMessageAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: reload };
  await deleteContactMessage(id.data);
  refresh();
  return {};
}
