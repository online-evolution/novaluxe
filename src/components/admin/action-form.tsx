"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { actionClass } from "@/components/ui/action";

export type ActionState = { error?: string; success?: string };

type ActionFormProps = {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  /** Kleine, rustige knop (bijv. "Verwijderen") in plaats van de volle knop. */
  quiet?: boolean;
  /** Na succes leegmaken, voor formulieren die iets toevoegen. */
  resetOnSuccess?: boolean;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Formulier voor een serveractie met directe terugkoppeling: "Opgeslagen" of
 * een foutmelding in gewone taal, bij de knop zelf.
 *
 * React leegt een formulier standaard na elke actie, ook na een fout. Hier
 * niet: wie een fout maakt, houdt zijn invoer en hoeft alleen te verbeteren.
 */
export function ActionForm({
  action,
  submitLabel,
  quiet,
  resetOnSuccess,
  className = "",
  children,
}: ActionFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state.success) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
      className={className}
    >
      {children}
      <div className={`flex flex-wrap items-center gap-x-6 gap-y-3 ${children ? "mt-8" : ""}`}>
        <button
          type="submit"
          disabled={pending}
          className={
            quiet
              ? "text-small text-ink-soft underline underline-offset-4 hover:text-alert disabled:opacity-60"
              : `${actionClass("primary")} disabled:opacity-60`
          }
        >
          {pending ? "Bezig…" : submitLabel}
        </button>
        {state.error && (
          <p role="alert" className="form-message text-alert">
            {state.error}
          </p>
        )}
        {state.success && !pending && (
          <p role="status" className="form-message text-bronze-deep">
            {state.success}
          </p>
        )}
      </div>
    </form>
  );
}
