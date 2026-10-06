"use client";

import { useActionState } from "react";
import { login, type FormState } from "@/app/admin/actions";
import { actionClass } from "@/components/ui/action";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(login, {});

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.error && (
        <p role="alert" className="form-message text-alert">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="field-label">
          E-mailadres
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          defaultValue={state.email}
          aria-invalid={state.error ? true : undefined}
          className="field-input"
        />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Wachtwoord
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state.error ? true : undefined}
          className="field-input"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className={`${actionClass("primary")} w-full justify-center disabled:opacity-60`}
      >
        {pending ? "Bezig met inloggen…" : "Inloggen"}
      </button>
    </form>
  );
}
