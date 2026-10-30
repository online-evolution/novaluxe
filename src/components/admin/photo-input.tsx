"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatAdvice, minPhotoWidth, ratioParts, type PhotoRatio } from "@/config/photo-shots";

/*
 * Fotoveld voor het beheer: kiezen (op de telefoon ook direct uit de
 * fotobibliotheek), met een voorbeeld in de verhouding van de plek en de
 * afmetingen van de gekozen foto. Het verkleinen gebeurt bij het versturen
 * (ActionForm, data-shrink). Alleen JPG, PNG en WebP: een iPhone zet een
 * HEIC-foto dan zelf om naar JPG.
 */
export function PhotoInput({
  name,
  label,
  ratio,
  required,
}: {
  name: string;
  label: string;
  /** Verhouding van de plek op de website: bepaalt het advies en het voorbeeld. */
  ratio: PhotoRatio;
  required?: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ url: string; width: number; height: number } | null>(null);
  const [ratioWidth, ratioHeight] = ratioParts(ratio);

  // Voorbeeld leegmaken als het formulier na opslaan wordt gereset.
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const clear = () => setPreview(null);
    form.addEventListener("reset", clear);
    return () => form.removeEventListener("reset", clear);
  }, []);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.url);
    },
    [preview],
  );

  const warnings: string[] = [];
  if (preview) {
    if (ratioWidth < ratioHeight && preview.width > preview.height * 1.05) {
      warnings.push("Deze foto is liggend. Op deze plek wordt hij flink bijgesneden; een staande foto past beter.");
    }
    if (ratioWidth > ratioHeight && preview.height > preview.width * 1.05) {
      warnings.push("Deze foto is staand. Op deze plek wordt hij flink bijgesneden; een liggende foto past beter.");
    }
    if (Math.min(preview.width, preview.height) < minPhotoWidth) {
      warnings.push("Deze foto is aan de kleine kant en kan op grote schermen wat zacht ogen.");
    }
  }

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="mt-2 flex items-start gap-4">
        <div
          aria-hidden="true"
          className="w-24 shrink-0 overflow-hidden border border-line bg-ivory bg-cover bg-center"
          style={{
            aspectRatio: `${ratioWidth} / ${ratioHeight}`,
            ...(preview ? { backgroundImage: `url(${preview.url})` } : {}),
          }}
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
            aria-describedby={`${id}-advies ${id}-gekozen`}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (!file) return setPreview(null);
              const url = URL.createObjectURL(file);
              const image = new Image();
              image.onload = () => setPreview({ url, width: image.naturalWidth, height: image.naturalHeight });
              image.onerror = () => setPreview({ url, width: 0, height: 0 });
              image.src = url;
            }}
            className="block w-full text-small file:mr-4 file:cursor-pointer file:border file:border-line-strong file:bg-cream file:px-4 file:py-2.5 file:font-medium hover:file:border-ink"
          />
          <p id={`${id}-advies`} className="mt-2 text-small text-ink-soft">
            Beste formaat: {formatAdvice(ratio).toLowerCase()}.
          </p>
          <div id={`${id}-gekozen`} aria-live="polite" className="text-small">
            {preview && preview.width > 0 && (
              <p className="mt-1 figures">
                Gekozen foto: {preview.width} × {preview.height} px
              </p>
            )}
            {warnings.map((warning) => (
              <p key={warning} className="mt-1 text-alert">
                {warning}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
