"use client";

import { startTransition, useActionState } from "react";
import { testIcloudAction, type IcloudTestState } from "@/app/admin/icloud/actions";
import { actionClass } from "@/components/ui/action";

/**
 * Formulier voor de iCloud-test: Apple ID en app-specifiek wachtwoord, één
 * knop, en daarna een lijst met vinkjes. Het wachtwoord wordt na de test niet
 * bewaard en nooit teruggestuurd.
 */
export function IcloudTestForm() {
  const [state, formAction, pending] = useActionState<IcloudTestState, FormData>(testIcloudAction, {});
  const report = state.report;
  const loginFailed = report?.steps.find((step) => step.label === "Inloggen bij iCloud")?.ok === false;

  return (
    <>
      <form
        action={formAction}
        // React leegt een formulier na elke actie; zo blijft het Apple ID staan.
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(() => formAction(data));
        }}
        className="grid max-w-xl gap-6"
      >
        <div>
          <label htmlFor="icloud-id" className="field-label">
            Apple ID (e-mailadres)
          </label>
          <input id="icloud-id" name="username" type="email" autoComplete="off" required className="field-input" />
        </div>
        <div>
          <label htmlFor="icloud-wachtwoord" className="field-label">
            App-specifiek wachtwoord
          </label>
          <input
            id="icloud-wachtwoord"
            name="password"
            type="password"
            autoComplete="off"
            placeholder="abcd-efgh-ijkl-mnop"
            required
            className="field-input"
          />
        </div>
        <label className="flex items-center gap-3 text-small">
          <input type="checkbox" name="alleenLezen" value="ja" className="size-5 accent-bronze-deep" />
          Alleen lezen (geen testafspraken maken)
        </label>
        {state.error && (
          <p role="alert" className="form-message text-alert">
            {state.error}
          </p>
        )}
        <div>
          <button type="submit" disabled={pending} className={`${actionClass("primary")} disabled:opacity-60`}>
            {pending ? "Bezig met testen… (kan een halve minuut duren)" : "Test de verbinding"}
          </button>
        </div>
      </form>

      {report && !pending && (
        <section aria-labelledby="icloud-uitslag" className="mt-12 max-w-3xl">
          <h2 id="icloud-uitslag" className="text-lede font-medium">
            {report.ok ? "Geslaagd: de verbinding met iCloud werkt" : "Niet geslaagd"}
          </h2>
          {loginFailed && (
            <p className="mt-3 text-ink-soft">
              Inloggen lukte niet. Controleer het Apple ID en gebruik een app-specifiek wachtwoord, niet het gewone
              wachtwoord van het Apple ID.
            </p>
          )}
          <ol className="mt-6 grid gap-3">
            {report.steps.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-small font-semibold ${
                    step.ok === false ? "bg-alert text-cream" : "bg-gold bg-(image:--gold-foil) text-ink"
                  }`}
                >
                  {step.ok === false ? "✗" : "✓"}
                </span>
                <span>
                  <span className="font-medium">{step.label}</span>
                  <span className="sr-only">{step.ok === false ? ": mislukt" : ": gelukt"}</span>
                  <span className="figures text-small text-ink-soft"> · {(step.ms / 1000).toFixed(1)} s</span>
                  {step.detail && <span className="block text-small text-ink-soft">{step.detail}</span>}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
