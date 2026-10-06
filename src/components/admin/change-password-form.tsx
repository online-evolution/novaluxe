"use client";

import { useActionState } from "react";
import { changePassword, type FormState } from "@/app/admin/actions";
import { actionClass } from "@/components/ui/action";

const fields = [
  { name: "current", label: "Huidig wachtwoord", autoComplete: "current-password" },
  { name: "next", label: "Nieuw wachtwoord", autoComplete: "new-password", hint: "Minimaal 12 tekens." },
  { name: "confirm", label: "Nieuw wachtwoord nog een keer", autoComplete: "new-password" },
] as const;

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(changePassword, {});

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <p role="alert" className="form-message text-alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="form-message text-bronze-deep">
          {state.success}
        </p>
      )}
      {fields.map((field) => (
        <div key={field.name}>
          <label htmlFor={field.name} className="field-label">
            {field.label}
          </label>
          <input
            id={field.name}
            name={field.name}
            type="password"
            autoComplete={field.autoComplete}
            required
            minLength={field.name === "current" ? undefined : 12}
            aria-describedby={"hint" in field ? `${field.name}-hint` : undefined}
            className="field-input"
          />
          {"hint" in field && (
            <p id={`${field.name}-hint`} className="mt-2 text-small text-ink-soft">
              {field.hint}
            </p>
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={pending}
        className={`${actionClass("primary")} disabled:opacity-60`}
      >
        {pending ? "Bezig…" : "Wachtwoord wijzigen"}
      </button>
    </form>
  );
}
