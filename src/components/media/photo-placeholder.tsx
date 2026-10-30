type PhotoPlaceholderProps = {
  /** Shot-ID uit PHOTO-SHOTLIST.md, bijvoorbeeld "N03". */
  shot: string;
  /** Wat er op de foto moet komen. */
  subject: string;
  /** Maat en beeldverhouding via klassen, bijvoorbeeld "aspect-[4/5]". */
  className?: string;
};

/**
 * Zichtbare plek waar nog een foto moet komen; Jessie plaatst die in het
 * beheer onder Foto's, met dezelfde code. Bewust herkenbaar als lege plek:
 * geen stock- of AI-beeld.
 */
export function PhotoPlaceholder({ shot, subject, className = "" }: PhotoPlaceholderProps) {
  return (
    <figure
      role="img"
      aria-label={`Foto volgt: ${subject}`}
      className={`relative flex items-end overflow-hidden bg-sand/35 ${className}`}
    >
      <figcaption className="flex w-full items-baseline justify-between gap-4 bg-cream/85 px-4 py-3 text-ink">
        <span className="text-small">{subject}</span>
        <span className="figures shrink-0 text-small font-semibold text-bronze-deep">{shot}</span>
      </figcaption>
    </figure>
  );
}
