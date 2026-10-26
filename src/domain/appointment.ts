/*
 * Wat Jessie met een afspraak kan doen, afhankelijk van status en tijd.
 * Puur, zodat het beheer en de serveracties dezelfde regels gebruiken en het
 * te testen is.
 */

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed"
  | "no_show"
  | "expired";

export type AdminAction = "confirm" | "reject" | "cancel" | "complete" | "no_show" | "reschedule";

export const statusLabels: Record<AppointmentStatus, string> = {
  pending: "Wacht op bevestiging",
  confirmed: "Bevestigd",
  rejected: "Afgewezen",
  cancelled: "Geannuleerd",
  completed: "Geweest",
  no_show: "Niet gekomen",
  expired: "Verlopen",
};

/** Nieuwe status na een actie (verplaatsen houdt de status gelijk). */
export const actionTargets: Record<Exclude<AdminAction, "reschedule">, AppointmentStatus> = {
  confirm: "confirmed",
  reject: "rejected",
  cancel: "cancelled",
  complete: "completed",
  no_show: "no_show",
};

type AppointmentTiming = {
  status: AppointmentStatus;
  startAt: Date;
  expiresAt: Date | null;
};

/**
 * Een aanvraag waarvan de bedenktijd voorbij is, telt als verlopen, ook als
 * de database hem nog niet heeft omgezet (dat gebeurt bij de volgende boeking).
 */
export function effectiveStatus(appointment: AppointmentTiming, now: Date): AppointmentStatus {
  if (appointment.status === "pending" && appointment.expiresAt !== null && appointment.expiresAt <= now) {
    return "expired";
  }
  return appointment.status;
}

export function allowedActions(appointment: AppointmentTiming, now: Date): AdminAction[] {
  const upcoming = appointment.startAt > now;
  switch (effectiveStatus(appointment, now)) {
    case "pending":
      return upcoming ? ["confirm", "reject"] : ["reject"];
    case "expired":
      // Alsnog bevestigen kan, als de tijd nog komt en (bij het opslaan) nog vrij is.
      return upcoming ? ["confirm"] : [];
    case "confirmed":
      return upcoming ? ["reschedule", "cancel"] : ["complete", "no_show", "cancel"];
    case "completed":
      return ["no_show"];
    case "no_show":
      return ["complete"];
    default:
      return [];
  }
}

/** Telt de afspraak mee in de agenda van de dag? */
export function isOnAgenda(status: AppointmentStatus): boolean {
  return status === "pending" || status === "confirmed" || status === "completed" || status === "no_show";
}
