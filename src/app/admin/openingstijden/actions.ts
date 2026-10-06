"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/components/admin/action-form";
import { optionalText, parseDateInput, parseTimeInput } from "@/lib/input";
import { localDateString, zonedDateTimeToUtc } from "@/lib/time";
import {
  addBlock,
  addException,
  deleteBlock,
  deleteException,
  replaceWeeklyHours,
  type HoursRow,
} from "@/server/admin/schedule";
import { requireAdmin } from "@/server/auth/session";
import { cacheTags } from "@/server/cache-tags";

const dayNames = ["", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "");

export async function saveWeeklyHoursAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const rows: HoursRow[] = [];
  for (let weekday = 1; weekday <= 7; weekday++) {
    if (formData.get(`d${weekday}.open`) !== "on") continue;
    const day = dayNames[weekday];
    const from = parseTimeInput(field(formData, `d${weekday}.from`));
    const to = parseTimeInput(field(formData, `d${weekday}.to`));
    if (!from.ok || !to.ok || to.value <= from.value) {
      return { error: `Controleer de tijden op ${day}: de sluitingstijd moet na de openingstijd liggen.` };
    }

    const breakFromText = field(formData, `d${weekday}.breakFrom`).trim();
    const breakToText = field(formData, `d${weekday}.breakTo`).trim();
    if (breakFromText === "" && breakToText === "") {
      rows.push({ weekday, opensAt: from.value, closesAt: to.value });
      continue;
    }
    const breakFrom = parseTimeInput(breakFromText);
    const breakTo = parseTimeInput(breakToText);
    if (
      !breakFrom.ok ||
      !breakTo.ok ||
      !(from.value < breakFrom.value && breakFrom.value < breakTo.value && breakTo.value < to.value)
    ) {
      return { error: `Controleer de pauze op ${day}: die moet binnen de openingstijden vallen.` };
    }
    rows.push({ weekday, opensAt: from.value, closesAt: breakFrom.value });
    rows.push({ weekday, opensAt: breakTo.value, closesAt: to.value });
  }

  await replaceWeeklyHours(rows);
  updateTag(cacheTags.businessHours);
  return { success: "Opgeslagen. De website is bijgewerkt." };
}

export async function addExceptionAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const date = parseDateInput(field(formData, "date"));
  if (!date.ok) return { error: "Kies een datum." };
  if (date.value < localDateString()) return { error: "Deze datum ligt in het verleden." };

  const note = optionalText(formData.get("note"));
  if (formData.get("kind") === "closed") {
    await addException({ date: date.value, kind: "closed", opensAt: null, closesAt: null, note });
  } else {
    const from = parseTimeInput(field(formData, "from"));
    const to = parseTimeInput(field(formData, "to"));
    if (!from.ok || !to.ok || to.value <= from.value) {
      return { error: "Vul een begin- en eindtijd in; de eindtijd moet na de begintijd liggen." };
    }
    await addException({
      date: date.value,
      kind: "custom_hours",
      opensAt: from.value,
      closesAt: to.value,
      note,
    });
  }

  updateTag(cacheTags.exceptions);
  return { success: "Toegevoegd." };
}

export async function deleteExceptionAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: "Er ging iets mis. Laad de pagina opnieuw." };
  await deleteException(id.data);
  updateTag(cacheTags.exceptions);
  return { success: "Verwijderd." };
}

const blockKinds = z.enum(["break", "vacation", "personal", "other"]);

export async function addBlockAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const startDate = parseDateInput(field(formData, "startDate"));
  const startTime = parseTimeInput(field(formData, "startTime"));
  const endDate = parseDateInput(field(formData, "endDate") || field(formData, "startDate"));
  const endTime = parseTimeInput(field(formData, "endTime"));
  const kind = blockKinds.safeParse(formData.get("kind"));
  if (!startDate.ok || !startTime.ok || !endDate.ok || !endTime.ok || !kind.success) {
    return { error: "Vul een begin en een einde in (datum en tijd)." };
  }

  const startAt = zonedDateTimeToUtc(startDate.value, startTime.value);
  const endAt = zonedDateTimeToUtc(endDate.value, endTime.value);
  if (endAt <= startAt) return { error: "Het einde moet na het begin liggen." };
  if (endAt <= new Date()) return { error: "Deze periode ligt al in het verleden." };

  await addBlock({ startAt, endAt, kind: kind.data, note: optionalText(formData.get("note")) });
  // Blokkades hebben (nog) geen publieke cache; ververs alleen dit scherm.
  refresh();
  return { success: "Toegevoegd." };
}

export async function deleteBlockAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: "Er ging iets mis. Laad de pagina opnieuw." };
  await deleteBlock(id.data);
  refresh();
  return { success: "Verwijderd." };
}
