import { z } from "zod";

/*
 * Instellingen die Jessie zelf beheert. Elke sleutel heeft een eigen
 * validatie en standaardwaarde; een ongeldige of ontbrekende waarde in de
 * database valt terug op de standaard.
 *
 * `null` = nog niet vastgesteld (zie PROJECT-TODOS.md). De code die zo'n
 * waarde nodig heeft, moet daar expliciet mee omgaan.
 */
export const settingsShape = {
  /** Stapgrootte van de tijdsloten in de reserveringsflow. */
  slotIntervalMinutes: z.int().min(5).max(120).default(15),
  /** Minimaal zoveel uur van tevoren aanvragen. */
  minLeadTimeHours: z.int().min(0).max(168).default(12),
  /** Maximaal zoveel weken vooruit aanvragen. */
  maxAdvanceWeeks: z.int().min(1).max(52).default(8),
  /** Behandeling moet volledig klaar zijn vóór sluitingstijd. */
  mustFinishBeforeClosing: z.boolean().default(true),
  /** Zoveel uur houdt een onbeantwoorde aanvraag het tijdslot vast. */
  pendingHoldHours: z.int().min(1).max(168).default(12),
  /** Extra tijd die een aanvraag met nail art standaard reserveert. */
  nailArtDefaultBufferMinutes: z.int().min(0).max(240).default(15),
  /** Bewaartermijn van nail-artvoorbeeldfoto's na de afspraak. Nog niet vastgesteld. */
  attachmentRetentionDays: z.int().min(1).max(365).nullable().default(null),
} as const;

export const settingsSchema = z.object(settingsShape);

export type Settings = z.infer<typeof settingsSchema>;
export type SettingKey = keyof Settings;

export const settingKeys = Object.keys(settingsShape) as SettingKey[];

export const defaultSettings: Settings = settingsSchema.parse({});

/** Bouwt instellingen op uit databaserijen; per sleutel terugvallen op de standaard. */
export function resolveSettings(rows: { key: string; value: unknown }[]): Settings {
  const stored = new Map(rows.map((row) => [row.key, row.value]));
  const result: Record<string, unknown> = {};
  for (const key of settingKeys) {
    const parsed = settingsShape[key].safeParse(stored.get(key));
    result[key] = parsed.success ? parsed.data : defaultSettings[key];
  }
  return result as Settings;
}
