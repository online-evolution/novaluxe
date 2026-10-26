/* Invoervelden voor beheerformulieren: altijd met een zichtbaar label. */

type FieldProps = {
  name: string;
  label: string;
  value?: string;
  required?: boolean;
  hint?: string;
  /** Maakt het id uniek als hetzelfde veld in meer formulieren op één pagina staat. */
  scope?: string;
};

const fieldId = (prefix: string, name: string, scope?: string) =>
  [prefix, scope, name].filter(Boolean).join("-").replace(/[^\w-]/g, "-");

function Hint({ id, text }: { id: string; text?: string }) {
  return text ? (
    <p id={id} className="mt-2 text-small text-ink-soft">
      {text}
    </p>
  ) : null;
}

export function TimeField({ name, label, value, required, hint, scope }: FieldProps) {
  const id = fieldId("tijd", name, scope);
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="time"
        step={300}
        defaultValue={value}
        required={required}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="field-input"
      />
      <Hint id={`${id}-hint`} text={hint} />
    </div>
  );
}

export function DateField({ name, label, value, required, hint, scope, min }: FieldProps & { min?: string }) {
  const id = fieldId("datum", name, scope);
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="date"
        min={min}
        defaultValue={value}
        required={required}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="field-input"
      />
      <Hint id={`${id}-hint`} text={hint} />
    </div>
  );
}

export function TextField({
  name,
  label,
  value,
  required,
  hint,
  scope,
  type = "text",
  inputMode,
  autoComplete,
  maxLength = 200,
}: FieldProps & {
  type?: "text" | "email" | "tel";
  inputMode?: "numeric" | "decimal" | "text";
  autoComplete?: string;
  maxLength?: number;
}) {
  const id = fieldId("veld", name, scope);
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        defaultValue={value}
        required={required}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="field-input"
      />
      <Hint id={`${id}-hint`} text={hint} />
    </div>
  );
}

export function TextArea({ name, label, value, hint, scope, rows = 4 }: FieldProps & { rows?: number }) {
  const id = fieldId("tekst", name, scope);
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        maxLength={2000}
        defaultValue={value}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="field-input"
      />
      <Hint id={`${id}-hint`} text={hint} />
    </div>
  );
}

/** Bevestiging voor een uitzondering, bijv. plannen buiten de openingstijden. */
export function ForceCheckbox({ label }: { label: string }) {
  return (
    <label className="flex items-start gap-3 text-small">
      <input type="checkbox" name="force" className="mt-0.5 size-5 shrink-0 accent-ink" />
      {label}
    </label>
  );
}
