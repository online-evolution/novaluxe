import type { Metadata } from "next";
import { Suspense } from "react";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader, Loading } from "@/components/admin/admin-page";
import { getSettingsForAdmin } from "@/server/admin/settings";
import { requireAdmin } from "@/server/auth/session";
import { saveSettingsAction } from "./actions";

export const metadata: Metadata = { title: "Instellingen" };

const intervals = [5, 10, 15, 20, 30, 60];

export default function SettingsPage() {
  return (
    <>
      <AdminPageHeader
        title="Instellingen"
        intro="Regels voor afspraakaanvragen. Deze gelden direct voor nieuwe aanvragen; bestaande afspraken veranderen niet."
      />
      <Suspense fallback={<Loading />}>
        <SettingsEditor />
      </Suspense>
    </>
  );
}

async function SettingsEditor() {
  await requireAdmin();
  const settings = await getSettingsForAdmin();

  return (
    <ActionForm action={saveSettingsAction} submitLabel="Opslaan" className="mt-10 max-w-2xl">
      <div className="divide-y divide-line border-y border-line-strong">
        <Setting
          id="slotIntervalMinutes"
          label="Tijdstappen in de agenda"
          help="Klanten kunnen kiezen uit tijden met deze tussenruimte, bijvoorbeeld 09:00, 09:15, 09:30."
        >
          <select
            id="slotIntervalMinutes"
            name="slotIntervalMinutes"
            defaultValue={settings.slotIntervalMinutes}
            className="field-input"
          >
            {intervals.map((minutes) => (
              <option key={minutes} value={minutes}>
                Elke {minutes} minuten
              </option>
            ))}
          </select>
        </Setting>

        <Setting
          id="minLeadTimeHours"
          label="Minimaal van tevoren aanvragen (uren)"
          help="Hoeveel uur er minimaal moet zitten tussen de aanvraag en de afspraak."
        >
          <NumberInput id="minLeadTimeHours" value={settings.minLeadTimeHours} />
        </Setting>

        <Setting
          id="maxAdvanceWeeks"
          label="Maximaal vooruit aanvragen (weken)"
          help="Hoe ver in de toekomst klanten een afspraak kunnen aanvragen."
        >
          <NumberInput id="maxAdvanceWeeks" value={settings.maxAdvanceWeeks} />
        </Setting>

        <Setting
          id="pendingHoldHours"
          label="Aanvraag houdt het tijdstip vast (uren)"
          help="Zolang je een aanvraag nog niet hebt bevestigd, kan niemand anders dat tijdstip kiezen. Na deze tijd vervalt de aanvraag en komt het tijdstip weer vrij. Een aanvraag vervalt nooit pas ná het begin van de afspraak."
        >
          <NumberInput id="pendingHoldHours" value={settings.pendingHoldHours} />
        </Setting>

        <Setting
          id="nailArtDefaultBufferMinutes"
          label="Extra tijd bij nail art (minuten)"
          help="Zoveel extra tijd wordt gereserveerd als een klant nail art aanvraagt. Bij het bevestigen bekijk je zelf of dat genoeg is."
        >
          <NumberInput id="nailArtDefaultBufferMinutes" value={settings.nailArtDefaultBufferMinutes} />
        </Setting>

        <Setting
          id="attachmentRetentionDays"
          label="Voorbeeldfoto's bewaren (dagen na de afspraak)"
          help="Hierna worden voorbeeldfoto's van klanten automatisch verwijderd. Leeg = nog niet ingesteld."
        >
          <NumberInput id="attachmentRetentionDays" value={settings.attachmentRetentionDays} />
        </Setting>

        <div className="py-6">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="mustFinishBeforeClosing"
              defaultChecked={settings.mustFinishBeforeClosing}
              className="mt-1 size-5 accent-ink"
            />
            <span>
              <span className="font-medium">Behandeling moet klaar zijn vóór sluitingstijd</span>
              <span className="mt-1 block text-small text-ink-soft">
                Staat dit aan, dan kan een klant geen behandeling aanvragen die na sluitingstijd
                doorloopt.
              </span>
            </span>
          </label>
        </div>
      </div>
    </ActionForm>
  );
}

function Setting({
  id,
  label,
  help,
  children,
}: {
  id: string;
  label: string;
  help: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 py-6 sm:grid-cols-[1fr_10rem] sm:gap-8">
      <div>
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        <p id={`${id}-uitleg`} className="mt-1 text-small text-ink-soft">
          {help}
        </p>
      </div>
      <div className="sm:pt-1">{children}</div>
    </div>
  );
}

function NumberInput({ id, value }: { id: string; value: number | null }) {
  return (
    <input
      id={id}
      name={id}
      inputMode="numeric"
      defaultValue={value ?? ""}
      aria-describedby={`${id}-uitleg`}
      className="field-input mt-0"
    />
  );
}
