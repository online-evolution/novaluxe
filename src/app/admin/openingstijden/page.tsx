import type { Metadata } from "next";
import { Suspense } from "react";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader, AdminSection, Loading } from "@/components/admin/admin-page";
import type { Weekday } from "@/domain/hours";
import { formatLongDate, localDateString, utcToZonedParts } from "@/lib/time";
import { listBlocksForAdmin, listExceptionsForAdmin } from "@/server/admin/schedule";
import { requireAdmin } from "@/server/auth/session";
import { getWeeklyHours } from "@/server/schedule";
import {
  addBlockAction,
  addExceptionAction,
  deleteBlockAction,
  deleteExceptionAction,
  saveWeeklyHoursAction,
} from "./actions";

export const metadata: Metadata = { title: "Openingstijden" };

const days: { weekday: Weekday; name: string }[] = [
  { weekday: 1, name: "Maandag" },
  { weekday: 2, name: "Dinsdag" },
  { weekday: 3, name: "Woensdag" },
  { weekday: 4, name: "Donderdag" },
  { weekday: 5, name: "Vrijdag" },
  { weekday: 6, name: "Zaterdag" },
  { weekday: 7, name: "Zondag" },
];

const blockKindLabels = {
  break: "Pauze",
  vacation: "Vakantie",
  personal: "Persoonlijke afspraak",
  other: "Anders",
} as const;

export default function OpeningHoursPage() {
  return (
    <>
      <AdminPageHeader
        title="Openingstijden"
        intro="Je vaste week, losse dagen die anders zijn, en tijden waarop je niet beschikbaar bent. Klanten kunnen alleen aanvragen binnen je openingstijden en buiten je blokkades."
      />
      <Suspense fallback={<Loading />}>
        <Editors />
      </Suspense>
    </>
  );
}

async function Editors() {
  await requireAdmin();
  const [week, exceptions, blocks] = await Promise.all([
    getWeeklyHours(),
    listExceptionsForAdmin(),
    listBlocksForAdmin(),
  ]);

  return (
    <>
      <AdminSection
        id="week"
        title="Vaste openingstijden"
        intro="Een pauze is optioneel. Tijdens de pauze kunnen klanten niets aanvragen."
      >
        <ActionForm action={saveWeeklyHoursAction} submitLabel="Openingstijden opslaan">
          <ul className="border-t border-line-strong">
            {days.map(({ weekday, name }) => {
              const ranges = week[weekday];
              const [first, second] = ranges;
              return (
                <li key={weekday} className="border-b border-line py-5">
                  <fieldset>
                    <legend className="sr-only">{name}</legend>
                    <label className="flex items-center gap-3 font-medium">
                      <input
                        type="checkbox"
                        name={`d${weekday}.open`}
                        defaultChecked={ranges.length > 0}
                        className="size-5 accent-ink"
                      />
                      {name} open
                    </label>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <TimeField name={`d${weekday}.from`} label="Open vanaf" value={first?.opensAt} />
                      <TimeField
                        name={`d${weekday}.to`}
                        label="Dicht om"
                        value={(second ?? first)?.closesAt}
                      />
                      <TimeField
                        name={`d${weekday}.breakFrom`}
                        label="Pauze van"
                        value={second ? first?.closesAt : undefined}
                      />
                      <TimeField
                        name={`d${weekday}.breakTo`}
                        label="Pauze tot"
                        value={second?.opensAt}
                      />
                    </div>
                  </fieldset>
                </li>
              );
            })}
          </ul>
        </ActionForm>
      </AdminSection>

      <AdminSection
        id="afwijkingen"
        title="Afwijkende dagen"
        intro="Een dag dicht, of andere tijden dan normaal. Bijvoorbeeld een feestdag, of een zondag dat je wél open bent. Je notitie ziet alleen jij."
      >
        {exceptions.length > 0 ? (
          <ul className="border-t border-line-strong">
            {exceptions.map((exception) => (
              <li
                key={exception.id}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line py-4"
              >
                <div>
                  <p className="font-medium first-letter:uppercase">{formatLongDate(exception.date)}</p>
                  <p className="text-small text-ink-soft">
                    {exception.kind === "closed"
                      ? "Gesloten"
                      : `${exception.opensAt?.slice(0, 5)}–${exception.closesAt?.slice(0, 5)}`}
                    {exception.note && ` · ${exception.note}`}
                  </p>
                </div>
                <ActionForm action={deleteExceptionAction} submitLabel="Verwijderen" quiet>
                  <input type="hidden" name="id" value={exception.id} />
                </ActionForm>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-small text-ink-soft">Er staan geen afwijkende dagen gepland.</p>
        )}

        <h3 className="mt-10 font-medium">Dag toevoegen</h3>
        <ActionForm action={addExceptionAction} submitLabel="Toevoegen" resetOnSuccess className="mt-4">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="exception-date" className="field-label">
                Datum
              </label>
              <input
                id="exception-date"
                name="date"
                type="date"
                min={localDateString()}
                required
                className="field-input"
              />
            </div>
            <fieldset>
              <legend className="field-label">Wat geldt er?</legend>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                <label className="flex items-center gap-2">
                  <input type="radio" name="kind" value="closed" defaultChecked className="size-5 accent-ink" />
                  Hele dag dicht
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="kind" value="custom_hours" className="size-5 accent-ink" />
                  Andere tijden
                </label>
              </div>
            </fieldset>
            <TimeField name="from" label="Open vanaf (bij andere tijden)" />
            <TimeField name="to" label="Dicht om (bij andere tijden)" />
            <div className="sm:col-span-2">
              <label htmlFor="exception-note" className="field-label">
                Notitie voor jezelf (optioneel)
              </label>
              <input id="exception-note" name="note" maxLength={500} className="field-input" />
            </div>
          </div>
        </ActionForm>
      </AdminSection>

      <AdminSection
        id="blokkades"
        title="Geblokkeerde tijden"
        intro="Momenten waarop je niet beschikbaar bent: een pauze, een eigen afspraak of vakantie. Voor vakantie kies je een begin- en einddatum."
      >
        {blocks.length > 0 ? (
          <ul className="border-t border-line-strong">
            {blocks.map((block) => {
              const start = utcToZonedParts(block.startAt);
              const end = utcToZonedParts(block.endAt);
              const sameDay = start.date === end.date;
              return (
                <li
                  key={block.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line py-4"
                >
                  <div>
                    <p className="font-medium first-letter:uppercase">
                      {formatLongDate(start.date)} {start.time}
                      {" – "}
                      {sameDay ? end.time : `${formatLongDate(end.date)} ${end.time}`}
                    </p>
                    <p className="text-small text-ink-soft">
                      {blockKindLabels[block.kind]}
                      {block.note && ` · ${block.note}`}
                    </p>
                  </div>
                  <ActionForm action={deleteBlockAction} submitLabel="Verwijderen" quiet>
                    <input type="hidden" name="id" value={block.id} />
                  </ActionForm>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-small text-ink-soft">Er staan geen blokkades gepland.</p>
        )}

        <h3 className="mt-10 font-medium">Blokkade toevoegen</h3>
        <ActionForm action={addBlockAction} submitLabel="Toevoegen" resetOnSuccess className="mt-4">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="block-start-date" className="field-label">
                Van (datum)
              </label>
              <input
                id="block-start-date"
                name="startDate"
                type="date"
                min={localDateString()}
                required
                className="field-input"
              />
            </div>
            <TimeField name="startTime" label="Van (tijd)" required />
            <div>
              <label htmlFor="block-end-date" className="field-label">
                Tot (datum, leeg = zelfde dag)
              </label>
              <input
                id="block-end-date"
                name="endDate"
                type="date"
                min={localDateString()}
                className="field-input"
              />
            </div>
            <TimeField name="endTime" label="Tot (tijd)" required />
            <div>
              <label htmlFor="block-kind" className="field-label">
                Soort
              </label>
              <select id="block-kind" name="kind" defaultValue="personal" className="field-input">
                {Object.entries(blockKindLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="block-note" className="field-label">
                Notitie voor jezelf (optioneel)
              </label>
              <input id="block-note" name="note" maxLength={500} className="field-input" />
            </div>
          </div>
        </ActionForm>
      </AdminSection>
    </>
  );
}

function TimeField({
  name,
  label,
  value,
  required,
}: {
  name: string;
  label: string;
  value?: string;
  required?: boolean;
}) {
  const id = `tijd-${name.replace(".", "-")}`;
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="time"
        step={300}
        defaultValue={value}
        required={required}
        className="field-input"
      />
    </div>
  );
}
