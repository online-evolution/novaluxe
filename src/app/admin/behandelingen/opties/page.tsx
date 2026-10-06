import type { Metadata } from "next";
import { Suspense } from "react";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader, Loading } from "@/components/admin/admin-page";
import { formatEuroInput } from "@/lib/money";
import { listOptionsForAdmin } from "@/server/admin/catalog";
import { requireAdmin } from "@/server/auth/session";
import { saveOptionsAction } from "../actions";

export const metadata: Metadata = { title: "Extra opties" };

export default function OptionsPage() {
  return (
    <>
      <AdminPageHeader
        title="Extra opties"
        back={{ href: "/admin/behandelingen", label: "Alle behandelingen" }}
      />
      <Suspense fallback={<Loading />}>
        <OptionsEditor />
      </Suspense>
    </>
  );
}

async function OptionsEditor() {
  await requireAdmin();
  const options = await listOptionsForAdmin();

  return (
    <ActionForm action={saveOptionsAction} submitLabel="Opslaan" className="mt-10 max-w-2xl">
      <div className="space-y-12">
        {options.map((option) => (
          <fieldset key={option.id} className="border-t border-line-strong pt-6">
            <legend className="text-lede font-medium">{option.name}</legend>
            <input type="hidden" name="optionId" value={option.id} />
            <input type="hidden" name={`${option.id}.label`} value={option.name} />

            {option.kind === "nail_art" ? (
              <p className="mt-2 text-small text-ink-soft">
                Prijs per nagel. De extra tijd stel je in onder Instellingen.
              </p>
            ) : (
              <p className="mt-2 text-small text-ink-soft">
                Extra prijs en tijd bovenop een nieuwe set BIAB of acryl.
              </p>
            )}

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor={`${option.id}-price`} className="field-label">
                  {option.kind === "nail_art" ? "Prijs per nagel (€)" : "Extra prijs (€)"}
                </label>
                <input
                  id={`${option.id}-price`}
                  name={`${option.id}.price`}
                  defaultValue={formatEuroInput(option.priceCents)}
                  inputMode="decimal"
                  className="field-input"
                />
              </div>
              {option.kind !== "nail_art" && (
                <div>
                  <label htmlFor={`${option.id}-duration`} className="field-label">
                    Extra tijd (minuten)
                  </label>
                  <input
                    id={`${option.id}-duration`}
                    name={`${option.id}.duration`}
                    defaultValue={option.durationMinutes ?? ""}
                    inputMode="numeric"
                    className="field-input"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              {option.kind !== "nail_art" && (
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name={`${option.id}.confirmed`}
                    defaultChecked={option.priceConfirmed}
                    className="mt-1 size-5 accent-ink"
                  />
                  <span>
                    Deze prijs klopt en mag op de website staan
                    <span className="block text-small text-ink-soft">
                      Zolang dit uit staat, toont de website deze prijs niet.
                    </span>
                  </span>
                </label>
              )}
              {option.kind === "nail_art" && (
                <input type="hidden" name={`${option.id}.confirmed`} value="on" />
              )}
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name={`${option.id}.active`}
                  defaultChecked={option.active}
                  className="size-5 accent-ink"
                />
                Deze optie is te kiezen
              </label>
            </div>
          </fieldset>
        ))}
      </div>
    </ActionForm>
  );
}
