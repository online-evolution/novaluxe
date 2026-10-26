"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useState } from "react";
import { requestReleaseAppointment, type ReleaseBookingState } from "@/app/(site)/reserveren/plaatsing/actions";
import { actionClass } from "@/components/ui/action";
import { formatLongDate, utcToZonedParts } from "@/lib/time";
import { SlotPicker, type AvailableDay } from "./slot-picker";

/*
 * Tijd kiezen voor een vrijgegeven extensionsplaatsing. Behandeling, prijs en
 * duur liggen vast (afgesproken bij het consult); de klant kiest alleen een
 * moment en kan een opmerking meesturen.
 */
export function ReleaseBooking({
  token,
  days,
  phone,
}: {
  token: string;
  days: AvailableDay[];
  phone: { display: string; href: string };
}) {
  const router = useRouter();
  const [date, setDate] = useState<string | null>(null);
  const [start, setStart] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<ReleaseBookingState, FormData>(requestReleaseAppointment, {});
  const [handled, setHandled] = useState(state);

  // Tijd net weg: keuze wissen en verse tijden ophalen (aanpassen tijdens renderen, niet in een effect).
  if (state !== handled) {
    setHandled(state);
    if (state.slotGone) {
      setStart(null);
      router.refresh();
    }
  }

  if (days.length === 0) {
    return (
      <p className="mt-8 max-w-measure">
        Er zijn op dit moment geen vrije tijden die lang genoeg zijn. Bel gerust{" "}
        <a href={phone.href} className="figures underline">
          {phone.display}
        </a>
        , dan zoeken we samen een moment.
      </p>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="startAt" value={start ?? ""} />
      <SlotPicker
        days={days}
        date={date}
        start={start}
        onDate={(value) => {
          setDate(value);
          setStart(null);
        }}
        onStart={setStart}
        notice={state.slotGone ? state.error : undefined}
      />

      <div className="mt-12 max-w-2xl">
        <label htmlFor="opmerking" className="field-label">
          Opmerking (optioneel)
        </label>
        <textarea id="opmerking" name="notes" rows={3} maxLength={1000} className="field-input" />

        {start && date && (
          <p className="mt-8 text-lede">
            <span className="inline-block first-letter:uppercase">{formatLongDate(date)}</span> om{" "}
            <span className="figures">{utcToZonedParts(new Date(start)).time}</span>
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button
            type="submit"
            disabled={!start || pending}
            className={`${actionClass("primary")} disabled:opacity-50`}
          >
            {pending ? "Bezig…" : "Afspraak aanvragen"}
          </button>
          {state.error && !state.slotGone && (
            <p role="alert" className="form-message text-alert">
              {state.error}
            </p>
          )}
        </div>
        <p className="mt-4 max-w-measure text-small text-ink-soft">
          Dit is een aanvraag. Jessie bevestigt je afspraak zo snel mogelijk.
        </p>
      </div>
    </form>
  );
}
