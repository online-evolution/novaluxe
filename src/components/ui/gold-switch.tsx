"use client";

import { useId } from "react";

/**
 * Keuzeschakelaar met een schuivend goudfolie-vlakje, zoals die van voor en na.
 * Radioknoppen eronder, dus met het toetsenbord te bedienen.
 */
export function GoldSwitch<T extends string | number>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const groupName = useId();
  const count = options.length;
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div
        className="relative inline-grid rounded-full bg-ivory p-1 text-small font-semibold"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-1 rounded-full bg-gold bg-(image:--gold-foil) transition-transform duration-500 ease-soft"
          style={{ width: `calc((100% - 0.5rem) / ${count})`, transform: `translateX(${index * 100}%)` }}
        />
        {options.map((option) => (
          <label key={option.value} className="relative">
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className="figures flex h-10 min-w-16 cursor-pointer items-center justify-center rounded-full px-4 whitespace-nowrap peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-bronze-deep">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
