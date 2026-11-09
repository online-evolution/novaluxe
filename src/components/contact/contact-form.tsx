"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { sendContactMessage, type ContactField, type ContactState } from "@/app/(site)/contact/actions";
import { actionClass } from "@/components/ui/action";

/**
 * Contactformulier. Het bericht komt in het beheer bij Jessie (Berichten).
 * Met een verborgen veld en een tijdcontrole tegen spam, zoals bij het
 * afspraakformulier.
 */
export function ContactForm() {
  const [state, formAction, pending] = useActionState<ContactState, FormData>(sendContactMessage, {});
  const startedAt = useRef<HTMLInputElement>(null);
  const thanks = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (startedAt.current) startedAt.current.value = String(Date.now());
  }, []);

  useEffect(() => {
    if (state.sent) thanks.current?.focus();
  }, [state.sent]);

  if (state.sent) {
    return (
      <p ref={thanks} tabIndex={-1} role="status" className="form-message max-w-measure text-lede outline-none">
        Bedankt voor je bericht. Ik neem zo snel mogelijk contact met je op.
      </p>
    );
  }

  const errors = state.fieldErrors ?? {};

  return (
    <form
      action={formAction}
      // React leegt een formulier na elke actie, ook na een fout; zo blijft de invoer staan.
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
      noValidate
      className="grid max-w-xl gap-6"
    >
      <Field id="contact-naam" name="name" label="Naam" autoComplete="name" error={errors.name} />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          id="contact-email"
          name="email"
          label="E-mailadres"
          type="email"
          inputMode="email"
          autoComplete="email"
          error={errors.email}
        />
        <Field
          id="contact-telefoon"
          name="phone"
          label="Telefoonnummer"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          error={errors.phone}
        />
      </div>
      <p className="-mt-3 text-small text-ink-soft">Vul je e-mailadres of je telefoonnummer in, of allebei.</p>
      <Field id="contact-bericht" name="message" label="Je vraag of bericht" multiline error={errors.message} />

      {/* Verborgen voor mensen; alleen bots vullen dit in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <input ref={startedAt} type="hidden" name="startedAt" defaultValue="0" />

      {state.error && (
        <p role="alert" className="form-message text-alert">
          {state.error}
        </p>
      )}
      <div>
        <button type="submit" disabled={pending} className={`${actionClass("primary")} disabled:opacity-60`}>
          {pending ? "Bezig met versturen…" : "Verstuur je bericht"}
        </button>
      </div>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  error,
  multiline = false,
  ...input
}: {
  id: string;
  name: ContactField;
  label: string;
  error?: string;
  multiline?: boolean;
} & Pick<React.InputHTMLAttributes<HTMLInputElement>, "type" | "inputMode" | "autoComplete">) {
  const described = error ? `${id}-fout` : undefined;
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          name={name}
          rows={5}
          maxLength={2000}
          aria-invalid={!!error}
          aria-describedby={described}
          className="field-input"
        />
      ) : (
        <input id={id} name={name} aria-invalid={!!error} aria-describedby={described} className="field-input" {...input} />
      )}
      {error && (
        <p id={described} className="mt-2 text-small text-alert">
          Let op: {error}
        </p>
      )}
    </div>
  );
}
