/* Invoervelden voor beheerformulieren: altijd met een zichtbaar label. */

type FieldProps = {
  name: string;
  label: string;
  value?: string;
  required?: boolean;
  hint?: string;
};

const fieldId = (prefix: string, name: string) => `${prefix}-${name.replace(/\W/g, "-")}`;

function Hint({ id, text }: { id: string; text?: string }) {
  return text ? (
    <p id={id} className="mt-2 text-small text-ink-soft">
      {text}
    </p>
  ) : null;
}

export function TimeField({ name, label, value, required, hint }: FieldProps) {
  const id = fieldId("tijd", name);
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

export function DateField({ name, label, value, required, hint, min }: FieldProps & { min?: string }) {
  const id = fieldId("datum", name);
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
  const id = fieldId("veld", name);
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

export function TextArea({ name, label, value, hint, rows = 4 }: FieldProps & { rows?: number }) {
  const id = fieldId("tekst", name);
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
