"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { actionClass } from "@/components/ui/action";
import { shrinkImagesIn } from "@/lib/shrink-image";

/** Iets onder de serverlimiet (4 MB) voor de extra bytes van het formulier. */
const uploadLimitBytes = 3.8 * 1024 * 1024;

export type ActionState = {
  error?: string;
  success?: string;
  /** Iets om te kopiëren dat maar één keer getoond wordt, zoals een vrijgavelink. */
  copy?: { label: string; value: string };
};

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
  // Foto's verkleinen gebeurt vóór de serveractie; dat telt ook als "bezig".
  const [preparing, setPreparing] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const busy = pending || preparing;

  useEffect(() => {
    if (resetOnSuccess && state.success) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        setClientError(null);
        if (form.querySelector("input[type=file][data-shrink]")) {
          setPreparing(true);
          const bytes = await shrinkImagesIn(form, data).finally(() => setPreparing(false));
          if (bytes > uploadLimitBytes) {
            setClientError("De foto's zijn samen te groot om te versturen. Probeer een andere foto.");
            return;
          }
        }
        startTransition(() => formAction(data));
      }}
      className={className}
    >
      {children}
      <div className={`flex flex-wrap items-center gap-x-6 gap-y-3 ${children ? "mt-8" : ""}`}>
        <button
          type="submit"
          disabled={busy}
          className={
            quiet
              ? "text-small text-ink-soft underline underline-offset-4 hover:text-alert disabled:opacity-60"
              : `${actionClass("primary")} disabled:opacity-60`
          }
        >
          {preparing ? "Foto's klaarmaken…" : pending ? "Bezig…" : submitLabel}
        </button>
        {(clientError ?? state.error) && !busy && (
          <p role="alert" className="form-message text-alert">
            {clientError ?? state.error}
          </p>
        )}
        {state.success && !busy && !clientError && (
          <p role="status" className="form-message text-bronze-deep">
            {state.success}
          </p>
        )}
      </div>
      {state.copy && !busy && <CopyField key={state.copy.value} {...state.copy} />}
    </form>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="mt-6 max-w-2xl border border-line-strong bg-ivory/50 p-4">
      <label htmlFor="kopieer-veld" className="field-label">
        {label}
      </label>
      <div className="mt-2 flex flex-wrap gap-3">
        <input
          ref={inputRef}
          id="kopieer-veld"
          readOnly
          value={value}
          onFocus={(event) => event.currentTarget.select()}
          className="field-input mt-0 min-w-0 flex-1 font-mono text-small"
        />
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
            } catch {
              inputRef.current?.select();
            }
          }}
          className={actionClass("quiet")}
        >
          {copied ? "Gekopieerd" : "Kopiëren"}
        </button>
      </div>
    </div>
  );
}
