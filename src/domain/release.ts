import type { AppointmentStatus } from "./appointment";

/*
 * Een vrijgave voor een nieuwe extensionsplaatsing is één link voor één
 * afspraak. Wordt een aanvraag via de link afgewezen of verloopt die, dan
 * werkt de link weer (tot de eigen einddatum), zodat de klant een andere tijd
 * kan kiezen zonder dat Jessie een nieuwe link hoeft te maken.
 */

export type ReleaseState = "open" | "aangevraagd" | "ingepland" | "verlopen" | "ingetrokken";

export const releaseStateLabels: Record<ReleaseState, string> = {
  open: "Link is open: de klant kan een tijd kiezen",
  aangevraagd: "De klant heeft een tijd aangevraagd",
  ingepland: "Ingepland",
  verlopen: "Link verlopen",
  ingetrokken: "Link ingetrokken",
};

/** Statussen van een afspraak die de link "verbruiken". */
export const releaseUsingStatuses = ["pending", "confirmed", "completed", "no_show"] as const satisfies AppointmentStatus[];

export function releaseState(
  release: { expiresAt: Date; revokedAt: Date | null },
  linked: { status: AppointmentStatus; expiresAt: Date | null }[],
  now: Date,
): ReleaseState {
  if (linked.some((item) => item.status === "confirmed" || item.status === "completed" || item.status === "no_show")) {
    return "ingepland";
  }
  if (linked.some((item) => item.status === "pending" && item.expiresAt !== null && item.expiresAt > now)) {
    return "aangevraagd";
  }
  if (release.revokedAt) return "ingetrokken";
  if (release.expiresAt <= now) return "verlopen";
  return "open";
}
