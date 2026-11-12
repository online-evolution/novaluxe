import Link from "next/link";
import { effectiveStatus, statusLabels, type AppointmentStatus } from "@/domain/appointment";
import { busyTitle, formatDuration, minutesBetween } from "@/lib/agenda";
import { formatLongDate, formatMoment, utcToZonedParts } from "@/lib/time";
import type { AppointmentListItem } from "@/server/admin/appointments";

/*
 * De agenda als rij kaarten: de tijd groot in de Bodoni, wie er komt, hoe lang
 * het duurt en waar de afspraak vandaan komt. Wat nu bezig is, krijgt goud; wat
 * vandaag al voorbij is, wordt stiller. Tussen de afspraken staat hoeveel tijd
 * er vrij is. De status staat er altijd in woorden bij; kleur is een extra hint.
 */

const statusTone: Record<AppointmentStatus, string> = {
  pending: "bg-gold/25 text-bronze-deep",
  confirmed: "bg-ink text-ivory",
  expired: "bg-alert/10 text-alert",
  rejected: "bg-ink/8 text-ink-soft",
  cancelled: "bg-ink/8 text-ink-soft",
  completed: "bg-ink/8 text-ink-soft",
  no_show: "bg-alert/10 text-alert",
};

const pill = "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label font-medium whitespace-nowrap";

export function StatusText({
  appointment,
  now,
}: {
  appointment: Pick<AppointmentListItem, "status" | "startAt" | "expiresAt">;
  now: Date;
}) {
  const status = effectiveStatus(appointment, now);
  return <span className={`${pill} ${statusTone[status]}`}>{statusLabels[status]}</span>;
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
  | { kind: "afspraak"; key: string; startAt: Date; endAt: Date; allDay: false; item: AppointmentListItem }
  | { kind: "icloud"; key: string; startAt: Date; endAt: Date; allDay: boolean; block: BusyBlock };

/** Vrije tijd tussen twee afspraken pas tonen vanaf dit aantal minuten. */
const minGapMinutes = 30;

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
  if (items.length === 0 && busy.length === 0) {
    return <p className="rounded-[1.5rem] bg-ivory/50 px-6 py-5 text-ink-soft">{empty}</p>;
  }

  const rows: Row[] = [
    ...items.map((item) => ({
      kind: "afspraak" as const,
      key: item.id,
      startAt: item.startAt,
      endAt: item.endAt,
      allDay: false as const,
      item,
    })),
    ...busy.map((block) => ({
      kind: "icloud" as const,
      key: block.id,
      startAt: block.startAt,
      endAt: block.endAt,
      allDay: block.allDay,
      block,
    })),
  ].sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.startAt.getTime() - b.startAt.getTime());

  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = showDate ? utcToZonedParts(row.startAt).date : "";
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  // Een overzicht per dag hoort bij de agenda, niet bij de lijst met aanvragen.
  const summarize = !showExpiry;

  return (
    <div className="grid gap-12">
      {[...groups].map(([date, group]) => (
        <div key={date || "lijst"}>
          {(showDate || summarize) && (
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              {showDate && <h3 className="text-lede font-medium first-letter:uppercase">{formatLongDate(date)}</h3>}
              {summarize && <p className="text-small text-ink-soft">{daySummary(group)}</p>}
            </div>
          )}
          <ol className="grid gap-3">{withGaps(group, now, !showDate, showExpiry)}</ol>
        </div>
      ))}
    </div>
  );
}

/** "6 afspraken, van 11:00 tot 20:15". */
function daySummary(group: Row[]): string {
  const count = group.length === 1 ? "1 afspraak" : `${group.length} afspraken`;
  const timed = group.filter((row) => !row.allDay);
  if (timed.length === 0) return count;
  const first = timed.reduce((a, b) => (a.startAt <= b.startAt ? a : b)).startAt;
  const last = timed.reduce((a, b) => (a.endAt >= b.endAt ? a : b)).endAt;
  return `${count}, van ${utcToZonedParts(first).time} tot ${utcToZonedParts(last).time}`;
}

/** De kaarten, met daartussen de vrije tijd als die er is. */
function withGaps(group: Row[], now: Date, dimPast: boolean, showExpiry: boolean) {
  const out: React.ReactNode[] = [];
  let latestEnd: Date | null = null;
  for (const row of group) {
    if (!row.allDay && latestEnd && minutesBetween(latestEnd, row.startAt) >= minGapMinutes) {
      out.push(
        <li key={`vrij-${row.key}`} className="flex items-center gap-3 py-1 pl-6 text-small text-ink-soft">
          <span aria-hidden="true" className="size-2 rounded-full border border-sand" />
          {utcToZonedParts(latestEnd).time} tot {utcToZonedParts(row.startAt).time} vrij ·{" "}
          {formatDuration(minutesBetween(latestEnd, row.startAt))}
        </li>,
      );
    }
    const timing = rowTiming(row, now, dimPast);
    out.push(
      row.kind === "afspraak" ? (
        <AppointmentCard key={row.key} item={row.item} now={now} timing={timing} showExpiry={showExpiry} />
      ) : (
        <ICloudCard key={row.key} block={row.block} timing={timing} />
      ),
    );
    if (!row.allDay && (!latestEnd || row.endAt > latestEnd)) latestEnd = row.endAt;
  }
  return out;
}

type Timing = "nu" | "voorbij" | "later";

function rowTiming(row: Row, now: Date, dimPast: boolean): Timing {
  if (row.allDay) return "later";
  if (row.startAt <= now && now < row.endAt) return "nu";
  if (dimPast && row.endAt <= now) return "voorbij";
  return "later";
}

const card =
  "grid grid-cols-[4.75rem_minmax(0,1fr)] items-start gap-x-4 gap-y-3 rounded-[1.5rem] border px-5 py-4 transition-colors duration-(--duration-quick) sm:grid-cols-[6.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-x-6 sm:px-6 sm:py-5";

function cardTone(timing: Timing, base: string): string {
  if (timing === "nu") return "border-gold bg-cream shadow-[0_18px_40px_-28px_rgb(122_92_62/0.7)]";
  if (timing === "voorbij") return `${base} opacity-55`;
  return base;
}

/** Bodoni met stevigere haarlijnen, zoals de grote koppen (zie globals.css). */
const bodoni = "font-display [font-optical-sizing:none] [font-variation-settings:'opsz'_20]";

function TimeColumn({ start, end, allDay }: { start: Date; end: Date; allDay: boolean }) {
  if (allDay) {
    return <p className={`${bodoni} text-[1.375rem] leading-tight`}>Hele dag</p>;
  }
  return (
    <p>
      <span className={`figures block ${bodoni} text-[1.75rem] leading-none sm:text-[2rem]`}>
        {utcToZonedParts(start).time}
      </span>
      <span className="figures mt-1.5 block text-small text-ink-soft">tot {utcToZonedParts(end).time}</span>
    </p>
  );
}

function NowPill() {
  return (
    <span className={`${pill} text-ink`} style={{ backgroundImage: "var(--gold-foil)" }}>
      Nu bezig
    </span>
  );
}

/**
 * Een afspraak uit Jessies eigen agenda: de titel zoals op haar iPhone (zonder
 * de tijd die ze er vaak voor zet), en uit welke agenda. Niet aan te klikken;
 * wijzigen doet ze op haar iPhone.
 */
function ICloudCard({ block, timing }: { block: BusyBlock; timing: Timing }) {
  const details = [
    !block.allDay && formatDuration(minutesBetween(block.startAt, block.endAt)),
    block.calendarName && `agenda ${block.calendarName}`,
  ].filter(Boolean);
  return (
    <li className={`${card} ${cardTone(timing, "border-line bg-cream")}`}>
      <TimeColumn start={block.startAt} end={block.endAt} allDay={block.allDay} />
      <div className="min-w-0">
        <p className="text-lede leading-snug font-medium break-words first-letter:uppercase">
          {busyTitle(block.title) ?? "Bezet"}
        </p>
        <p className="mt-1 text-small text-ink-soft">{details.join(" · ")}</p>
      </div>
      <div className="col-start-2 flex flex-wrap gap-2 sm:col-start-3 sm:justify-end">
        {timing === "nu" && <NowPill />}
        <span className={`${pill} bg-ivory text-ink-soft`}>
          <PhoneIcon />
          iPhone-agenda
        </span>
      </div>
    </li>
  );
}

/** Een afspraak via de site of door Jessie ingevoerd: klik voor de details. */
function AppointmentCard({
  item,
  now,
  timing,
  showExpiry,
}: {
  item: AppointmentListItem;
  now: Date;
  timing: Timing;
  showExpiry: boolean;
}) {
  const status = effectiveStatus(item, now);
  const details = [
    item.treatmentName,
    item.variantLabel !== item.treatmentName && item.variantLabel,
    item.nailArtRequested && "met nail art",
    formatDuration(minutesBetween(item.startAt, item.endAt)),
  ].filter(Boolean);
  return (
    <li>
      <Link
        href={`/admin/afspraken/${item.id}`}
        className={`${card} group ${cardTone(timing, "border-gold/45 bg-ivory/55 hover:border-gold hover:bg-ivory/80")}`}
      >
        <TimeColumn start={item.startAt} end={item.endAt} allDay={false} />
        <div className="min-w-0">
          <p className="text-lede leading-snug font-medium break-words">{item.customerName}</p>
          <p className="mt-1 text-small text-ink-soft">{details.join(" · ")}</p>
          {showExpiry && status === "pending" && item.expiresAt && (
            <p className="mt-1 text-small text-bronze-deep">Tijd vastgehouden tot {formatMoment(item.expiresAt)}</p>
          )}
        </div>
        <div className="col-start-2 flex flex-wrap items-center gap-2 sm:col-start-3 sm:justify-end">
          {timing === "nu" && <NowPill />}
          <StatusText appointment={item} now={now} />
          <span
            aria-hidden="true"
            className="hidden text-ink-soft transition-transform duration-(--duration-quick) group-hover:translate-x-0.5 sm:inline"
          >
            →
          </span>
        </div>
      </Link>
    </li>
  );
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="4" y="1.5" width="8" height="13" rx="2" />
      <path d="M7 12.25h2" strokeLinecap="round" />
    </svg>
  );
}
