import ICAL from "ical.js";

/*
 * Uit iCalendar-data alleen halen wat NovaLuxe mag weten van een
 * privéafspraak: begin, einde en bezet/vrij. Titel, beschrijving, locatie en
 * deelnemers worden nooit gelezen. Bewezen in de iCloud-spike (Fase 14,
 * docs/icloud-spike.md).
 */

export type BusyInterval = {
  start: Date;
  end: Date;
  /** Hele dag (DATE in plaats van DATE-TIME). */
  allDay: boolean;
};

export type BusyStats = {
  events: number;
  recurring: number;
  allDay: number;
  /** Op "vrij" gezet in de agenda (TRANSP:TRANSPARENT). */
  transparent: number;
  cancelled: number;
  /** Uitzonderingen op een herhaling (RECURRENCE-ID). */
  exceptions: number;
};

/** Grens tegen eindeloze herhalingen binnen het venster. */
const maxOccurrencesPerEvent = 1000;

/**
 * Bezette tijdvakken binnen [from, to) uit één of meer iCalendar-teksten.
 * Herhalingen worden zelf uitgerold (ook als de server dat niet doet), met
 * uitzonderingen en tijdzones uit de VTIMEZONE-blokken van de data zelf.
 */
export function busyIntervals(icsTexts: string[], from: Date, to: Date): { intervals: BusyInterval[]; stats: BusyStats } {
  const stats: BusyStats = { events: 0, recurring: 0, allDay: 0, transparent: 0, cancelled: 0, exceptions: 0 };
  const intervals: BusyInterval[] = [];

  for (const text of icsTexts) {
    const calendar = new ICAL.Component(ICAL.parse(text));
    for (const zone of calendar.getAllSubcomponents("vtimezone")) {
      ICAL.TimezoneService.register(zone);
    }

    // Uitzonderingen horen bij hun hoofdafspraak (zelfde UID).
    const vevents = calendar.getAllSubcomponents("vevent");
    const masters = new Map<string, ICAL.Event>();
    const exceptions: ICAL.Component[] = [];
    for (const vevent of vevents) {
      if (vevent.hasProperty("recurrence-id")) exceptions.push(vevent);
      else masters.set(String(vevent.getFirstPropertyValue("uid")), new ICAL.Event(vevent));
    }
    for (const exception of exceptions) {
      stats.exceptions++;
      const master = masters.get(String(exception.getFirstPropertyValue("uid")));
      if (master) master.relateException(exception);
      else masters.set(`los:${stats.exceptions}`, new ICAL.Event(exception));
    }

    for (const event of masters.values()) {
      stats.events++;
      const component = event.component;
      if (String(component.getFirstPropertyValue("status") ?? "").toUpperCase() === "CANCELLED") {
        stats.cancelled++;
        continue;
      }
      if (String(component.getFirstPropertyValue("transp") ?? "").toUpperCase() === "TRANSPARENT") {
        stats.transparent++;
        continue;
      }
      const allDay = event.startDate.isDate;
      if (allDay) stats.allDay++;

      if (!event.isRecurring()) {
        push(intervals, event.startDate.toJSDate(), event.endDate.toJSDate(), allDay, from, to);
        continue;
      }

      stats.recurring++;
      const iterator = event.iterator();
      for (let count = 0, next = iterator.next(); next && count < maxOccurrencesPerEvent; next = iterator.next(), count++) {
        if (next.toJSDate() >= to) break;
        const details = event.getOccurrenceDetails(next);
        // Een uitzondering kan zelf geannuleerd of op vrij gezet zijn.
        const item = details.item.component;
        if (String(item.getFirstPropertyValue("status") ?? "").toUpperCase() === "CANCELLED") continue;
        if (String(item.getFirstPropertyValue("transp") ?? "").toUpperCase() === "TRANSPARENT") continue;
        push(intervals, details.startDate.toJSDate(), details.endDate.toJSDate(), details.startDate.isDate, from, to);
      }
    }
  }

  intervals.sort((a, b) => a.start.getTime() - b.start.getTime());
  return { intervals, stats };
}

function push(list: BusyInterval[], start: Date, end: Date, allDay: boolean, from: Date, to: Date) {
  if (end <= from || start >= to) return;
  list.push({ start, end, allDay });
}
