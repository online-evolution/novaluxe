import type { Metadata } from "next";
import { Suspense } from "react";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader, AdminSection, Loading } from "@/components/admin/admin-page";
import { DateField, ForceCheckbox, TextArea, TextField, TimeField } from "@/components/admin/fields";
import { formatEuro } from "@/lib/format";
import { localDateString } from "@/lib/time";
import { listVariantsForPlanning } from "@/server/admin/appointments";
import { requireAdmin } from "@/server/auth/session";
import { createAppointmentAction } from "../actions";

export const metadata: Metadata = { title: "Afspraak toevoegen" };

const kindLabels = { standard: "", new_set: "nieuwe set", refill: "opvullen" } as const;

export default function NewAppointmentPage() {
  return (
    <>
      <AdminPageHeader
        title="Afspraak toevoegen"
        intro="Voor een afspraak die je zelf maakt, bijvoorbeeld telefonisch of in de salon. Die staat meteen als bevestigd in je agenda."
        back={{ href: "/admin/afspraken", label: "Afspraken" }}
      />
      <Suspense fallback={<Loading />}>
        <NewAppointmentForm />
      </Suspense>
    </>
  );
}

async function NewAppointmentForm() {
  await requireAdmin();
  const variants = await listVariantsForPlanning();
  const groups = new Map<string, typeof variants>();
  for (const variant of variants) {
    groups.set(variant.treatmentName, [...(groups.get(variant.treatmentName) ?? []), variant]);
  }

  return (
    <ActionForm action={createAppointmentAction} submitLabel="Afspraak opslaan" className="max-w-3xl">
      <AdminSection title="Behandeling">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="behandeling" className="field-label">
              Behandeling
            </label>
            <select id="behandeling" name="variantId" required defaultValue="" className="field-input">
              <option value="" disabled>
                Kies een behandeling
              </option>
              {[...groups].map(([name, items]) => (
                <optgroup key={name} label={name}>
                  {items.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {[variant.label, kindLabels[variant.kind]].filter(Boolean).join(", ")}
                      {" — "}
                      {variant.priceCents !== null ? formatEuro(variant.priceCents) : "prijs onbekend"}
                      {", "}
                      {variant.durationMinutes !== null ? `${variant.durationMinutes} min` : "duur onbekend"}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <TextField
            name="duration"
            label="Duur in minuten (optioneel)"
            inputMode="numeric"
            maxLength={3}
            hint="Leeg = de vaste duur van de behandeling. Vul hem in als die nog onbekend is, of als je extra tijd nodig hebt."
          />
          <TextField
            name="price"
            label="Prijs (optioneel)"
            inputMode="decimal"
            maxLength={12}
            hint="Leeg = de vaste prijs. Typ bijvoorbeeld 45 of 255,50 voor een andere prijs."
          />
        </div>
      </AdminSection>

      <AdminSection title="Wanneer">
        <div className="grid gap-6 sm:grid-cols-2">
          <DateField name="date" label="Datum" min={localDateString()} required />
          <TimeField name="time" label="Begintijd" required />
          <div className="sm:col-span-2">
            <ForceCheckbox label="Toch inplannen, ook buiten mijn openingstijden of over een blokkade" />
          </div>
        </div>
      </AdminSection>

      <AdminSection title="Klant" intro="Komt deze klant al eerder? Gebruik hetzelfde e-mailadres, dan staat alles bij elkaar.">
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField name="name" label="Naam" autoComplete="off" required />
          <TextField name="phone" label="Telefoonnummer" type="tel" autoComplete="off" required />
          <TextField name="email" label="E-mailadres (optioneel)" type="email" autoComplete="off" />
          <div className="sm:col-span-2">
            <TextArea name="notes" label="Notitie voor jezelf (optioneel)" rows={3} />
          </div>
        </div>
      </AdminSection>
    </ActionForm>
  );
}
