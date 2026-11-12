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
  busy = [],
  now,
  empty,
  showDate = false,
  showExpiry = false,
}: {
  items: AppointmentListItem[];
  /** Afspraken uit Jessies eigen iCloud-agenda, tussen de rest op volgorde van tijd. */
  busy?: BusyBlock[];
  now: Date;
  empty: string;
  /** Per datum groeperen (voor lijsten over meerdere dagen). */
  showDate?: boolean;
  /** Bij aanvragen: tot wanneer de tijd wordt vastgehouden. */
  showExpiry?: boolean;
}) {
  if (items.length === 0 && busy.length === 0) return <p className="text-small text-ink-soft">{empty}</p>;

  const rows: Row[] = [
    ...items.map((item) => ({ kind: "afspraak" as const, key: item.id, startAt: item.startAt, item })),
    ...busy.map((block) => ({ kind: "icloud" as const, key: block.id, startAt: block.startAt, block })),
  ].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = showDate ? utcToZonedParts(row.startAt).date : "";
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return (
    <div className="grid gap-10">
      {[...groups].map(([date, group]) => (
        <div key={date || "lijst"}>
          {showDate && <h3 className="mb-3 font-medium first-letter:uppercase">{formatLongDate(date)}</h3>}
          <ul className="border-t border-line-strong">
            {group.map((row) =>
              row.kind === "afspraak" ? (
                <AppointmentRow key={row.key} item={row.item} now={now} showExpiry={showExpiry} />
              ) : (
                <ICloudRow key={row.key} block={row.block} />
              ),
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}

export type BusyBlock = {
  id: string;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  title: string | null;
  calendarName: string | null;
};

type Row =
  | { kind: "afspraak"; key: string; startAt: Date; item: AppointmentListItem }
  | { kind: "icloud"; key: string; startAt: Date; block: BusyBlock };

/**
 * Een afspraak uit Jessies eigen agenda: titel zoals op haar iPhone, en uit
 * welke agenda. Niet aan te klikken; wijzigen doet ze op haar iPhone.
 */
function ICloudRow({ block }: { block: BusyBlock }) {
  return (
    <li className="grid grid-cols-[4.5rem_1fr] gap-x-4 gap-y-1 border-b border-line py-4 sm:grid-cols-[6rem_1fr_auto]">
      <span className="figures font-medium">
        {block.allDay ? (
          "Hele dag"
        ) : (
          <>
            {utcToZonedParts(block.startAt).time}
            <span className="block text-small font-normal text-ink-soft">tot {utcToZonedParts(block.endAt).time}</span>
          </>
        )}
      </span>
      <span>
        <span className="block font-medium">{block.title ?? "Bezet"}</span>
        <span className="block text-small text-ink-soft">
          {block.calendarName ? `iCloud-agenda ${block.calendarName}` : "iCloud-agenda"}
        </span>
      </span>
      <span className="col-start-2 text-small text-ink-soft sm:col-start-3 sm:text-right">Op je iPhone</span>
    </li>
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
