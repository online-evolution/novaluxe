import Link from "next/link";
import { effectiveStatus, statusLabels, type AppointmentStatus } from "@/domain/appointment";
import { formatLongDate, formatMoment, utcToZonedParts } from "@/lib/time";
import type { AppointmentListItem } from "@/server/admin/appointments";

/*
 * Afspraken als rustige lijst: tijd, behandeling, klant en status. De status
 * staat er altijd in woorden bij; kleur is alleen een extra hint.
 */

const statusTone: Record<AppointmentStatus, string> = {
  pending: "text-bronze-deep font-medium",
  confirmed: "text-ink",
  expired: "text-alert",
  rejected: "text-ink-soft",
  cancelled: "text-ink-soft",
  completed: "text-ink-soft",
  no_show: "text-alert",
};

export function StatusText({
  appointment,
  now,
}: {
  appointment: Pick<AppointmentListItem, "status" | "startAt" | "expiresAt">;
  now: Date;
}) {
  const status = effectiveStatus(appointment, now);
  return <span className={statusTone[status]}>{statusLabels[status]}</span>;
}

export function AppointmentList({
  items,
  now,
  empty,
  showDate = false,
  showExpiry = false,
}: {
  items: AppointmentListItem[];
  now: Date;
  empty: string;
  /** Per datum groeperen (voor lijsten over meerdere dagen). */
  showDate?: boolean;
  /** Bij aanvragen: tot wanneer de tijd wordt vastgehouden. */
  showExpiry?: boolean;
}) {
  if (items.length === 0) return <p className="text-small text-ink-soft">{empty}</p>;

  const groups = new Map<string, AppointmentListItem[]>();
  for (const item of items) {
    const key = showDate ? utcToZonedParts(item.startAt).date : "";
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return (
    <div className="grid gap-10">
      {[...groups].map(([date, group]) => (
        <div key={date || "lijst"}>
          {showDate && <h3 className="mb-3 font-medium first-letter:uppercase">{formatLongDate(date)}</h3>}
          <ul className="border-t border-line-strong">
            {group.map((item) => (
              <AppointmentRow key={item.id} item={item} now={now} showExpiry={showExpiry} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function AppointmentRow({ item, now, showExpiry }: { item: AppointmentListItem; now: Date; showExpiry: boolean }) {
  const start = utcToZonedParts(item.startAt).time;
  const end = utcToZonedParts(item.endAt).time;
  const status = effectiveStatus(item, now);
  return (
    <li className="border-b border-line">
      <Link
        href={`/admin/afspraken/${item.id}`}
        className="grid grid-cols-[4.5rem_1fr] gap-x-4 gap-y-1 py-4 hover:bg-ivory/60 sm:grid-cols-[6rem_1fr_auto]"
      >
        <span className="figures font-medium">
          {start}
          <span className="block text-small font-normal text-ink-soft">tot {end}</span>
        </span>
        <span>
          <span className="block font-medium">{item.treatmentName}</span>
          <span className="block text-small text-ink-soft">
            {[
              item.variantLabel !== item.treatmentName && item.variantLabel,
              item.nailArtRequested && "met nail art",
              item.customerName,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
          {showExpiry && status === "pending" && item.expiresAt && (
            <span className="mt-1 block text-small text-ink-soft">
              Tijd vastgehouden tot {formatMoment(item.expiresAt)}
            </span>
          )}
        </span>
        <span className="col-start-2 text-small sm:col-start-3 sm:text-right">
          <StatusText appointment={item} now={now} />
        </span>
      </Link>
    </li>
  );
}

export type BusyBlock = { id: string; startAt: Date; endAt: Date; allDay: boolean };

/**
 * Eén dag: afspraken uit NovaLuxe en bezette tijden uit Jessies eigen
 * iCloud-agenda's, op volgorde van tijd. Van die tijden bewaren we alleen
 * begin en einde (docs/besluiten.md), dus er staat geen naam bij.
 */
export function DayAgenda({
  items,
  busy,
  now,
  empty,
}: {
  items: AppointmentListItem[];
  busy: BusyBlock[];
  now: Date;
  empty: string;
}) {
  if (items.length === 0 && busy.length === 0) return <p className="text-small text-ink-soft">{empty}</p>;

  const rows = [
    ...items.map((item) => ({ kind: "afspraak" as const, at: item.startAt.getTime(), item })),
    ...busy.map((block) => ({ kind: "bezet" as const, at: block.allDay ? 0 : block.startAt.getTime(), block })),
  ].sort((a, b) => a.at - b.at);

  return (
    <ul className="border-t border-line-strong">
      {rows.map((row) =>
        row.kind === "afspraak" ? (
          <AppointmentRow key={row.item.id} item={row.item} now={now} showExpiry={false} />
        ) : (
          <li
            key={row.block.id}
            className="grid grid-cols-[4.5rem_1fr] gap-x-4 gap-y-1 border-b border-line py-4 text-ink-soft sm:grid-cols-[6rem_1fr_auto]"
          >
            <span className="figures">
              {row.block.allDay ? (
                "Hele dag"
              ) : (
                <>
                  {utcToZonedParts(row.block.startAt).time}
                  <span className="block text-small">tot {utcToZonedParts(row.block.endAt).time}</span>
                </>
              )}
            </span>
            <span>
              <span className="block">Bezet in je iCloud-agenda</span>
              <span className="block text-small">Niet online te boeken</span>
            </span>
          </li>
        ),
      )}
    </ul>
  );
}
