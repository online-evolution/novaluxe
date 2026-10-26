"use client";

import { useEffect, useId, useRef, useState } from "react";

/*
 * Fotoveld voor het beheer: kiezen (op de telefoon ook direct uit de
 * fotobibliotheek), met een voorbeeld. Het verkleinen gebeurt bij het
 * versturen (ActionForm, data-shrink). Alleen JPG, PNG en WebP: een iPhone
 * zet een HEIC-foto dan zelf om naar JPG.
 */
export function PhotoInput({
  name,
  label,
  required,
  hint,
}: {
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Voorbeeld leegmaken als het formulier na opslaan wordt gereset.
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const clear = () => setPreview(null);
    form.addEventListener("reset", clear);
    return () => form.removeEventListener("reset", clear);
  }, []);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="mt-2 flex items-start gap-4">
        <div
          aria-hidden="true"
          className="aspect-[4/5] w-24 shrink-0 overflow-hidden border border-line bg-ivory bg-cover bg-center"
          style={preview ? { backgroundImage: `url(${preview})` } : undefined}
        />
        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            id={id}
            name={name}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required={required}
            data-shrink
            aria-describedby={hint ? `${id}-hint` : undefined}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
            className="block w-full text-small file:mr-4 file:cursor-pointer file:border file:border-line-strong file:bg-cream file:px-4 file:py-2.5 file:font-medium hover:file:border-ink"
          />
          {hint && (
            <p id={`${id}-hint`} className="mt-2 text-small text-ink-soft">
              {hint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
