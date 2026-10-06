import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader, Loading } from "@/components/admin/admin-page";
import { formatEuroInput } from "@/lib/money";
import { getTreatmentForAdmin } from "@/server/admin/catalog";
import { requireAdmin } from "@/server/auth/session";
import { saveTreatmentAction } from "../actions";

export const metadata: Metadata = { title: "Behandeling aanpassen" };

const kindLabel = { standard: "", new_set: "Nieuwe set", refill: "Opvullen" } as const;

export default function TreatmentEditPage({ params }: PageProps<"/admin/behandelingen/[slug]">) {
  return (
    <Suspense fallback={<Loading />}>
      <TreatmentEditor params={params} />
    </Suspense>
  );
}

async function TreatmentEditor({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const treatment = await getTreatmentForAdmin(slug);
  if (!treatment) notFound();

  return (
    <>
      <AdminPageHeader
        title={treatment.name}
        intro="Laat prijs of duur leeg als die nog niet bekend is: de variant staat dan op de website, maar is nog niet online te boeken."
        back={{ href: "/admin/behandelingen", label: "Alle behandelingen" }}
      />

      <ActionForm action={saveTreatmentAction} submitLabel="Opslaan" className="mt-10 max-w-3xl">
        <input type="hidden" name="treatmentId" value={treatment.id} />

        <label className="flex items-center gap-3 border-y border-line-strong py-4 font-medium">
          <input
            type="checkbox"
            name="active"
            defaultChecked={treatment.active}
            className="size-5 accent-ink"
          />
          Deze behandeling staat op de website
        </label>

        <div
          aria-hidden="true"
          className="mt-8 hidden grid-cols-[1fr_7rem_6rem_3rem] gap-4 text-small text-ink-soft sm:grid"
        >
          <span>Variant</span>
          <span>Prijs (€)</span>
          <span>Duur (min)</span>
          <span>Aan</span>
        </div>

        <ul className="mt-2 border-t border-line">
          {treatment.variants.map((variant) => {
            const label = [variant.label, kindLabel[variant.kind]].filter(Boolean).join(" · ");
            const incomplete = variant.priceCents === null || variant.durationMinutes === null;
            return (
              <li
                key={variant.id}
                className="grid grid-cols-[1fr_1fr_auto] items-center gap-x-4 gap-y-2 border-b border-line py-4 sm:grid-cols-[1fr_7rem_6rem_3rem]"
              >
                <input type="hidden" name="variantId" value={variant.id} />
                <input type="hidden" name={`${variant.id}.label`} value={label} />
                <p className="col-span-3 sm:col-span-1">
                  {label}
                  {incomplete && (
                    <span className="block text-small text-ink-soft">Nog niet online te boeken</span>
                  )}
                </p>
                <label className="text-small text-ink-soft sm:text-ink">
                  <span className="sm:sr-only">Prijs (€)</span>
                  <input
                    name={`${variant.id}.price`}
                    defaultValue={formatEuroInput(variant.priceCents)}
                    inputMode="decimal"
                    aria-label={`Prijs ${label}`}
                    className="field-input mt-1 sm:mt-0"
                  />
                </label>
                <label className="text-small text-ink-soft sm:text-ink">
                  <span className="sm:sr-only">Duur (min)</span>
                  <input
                    name={`${variant.id}.duration`}
                    defaultValue={variant.durationMinutes ?? ""}
                    inputMode="numeric"
                    aria-label={`Duur in minuten ${label}`}
                    className="field-input mt-1 sm:mt-0"
                  />
                </label>
                <label className="flex flex-col items-center text-small text-ink-soft">
                  <span className="sm:sr-only">Aan</span>
                  <input
                    type="checkbox"
                    name={`${variant.id}.active`}
                    defaultChecked={variant.active}
                    aria-label={`${label} aan`}
                    className="mt-2 size-5 accent-ink sm:mt-0"
                  />
                </label>
              </li>
            );
          })}
        </ul>
      </ActionForm>
    </>
  );
}
