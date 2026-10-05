type PhotoPlaceholderProps = {
  /** Shot-ID uit PHOTO-SHOTLIST.md, bijvoorbeeld "N03". */
  shot: string;
  /** Wat er op de foto moet komen. */
  subject: string;
  /** Beeldverhouding als CSS aspect-ratio, bijvoorbeeld "4 / 5". */
  ratio: string;
  className?: string;
};

/**
 * Zichtbare plek voor echte NovaLuxe-fotografie die nog gemaakt wordt.
 * Bewust herkenbaar als placeholder: geen stock- of AI-beeld.
 */
export function PhotoPlaceholder({
  shot,
  subject,
  ratio,
  className = "",
}: PhotoPlaceholderProps) {
  return (
    <figure
      role="img"
      aria-label={`Foto volgt: ${subject}`}
      className={`relative flex items-end overflow-hidden bg-ivory ${className}`}
      style={{
        aspectRatio: ratio,
        backgroundImage:
          "repeating-linear-gradient(135deg, transparent 0 14px, rgb(51 44 37 / 0.05) 14px 15px)",
      }}
    >
      <figcaption className="flex w-full items-baseline justify-between gap-4 border-t border-line bg-ivory/90 px-4 py-3">
        <span className="text-small text-ink-soft">{subject}</span>
        <span className="label figures shrink-0 text-bronze-deep">{shot}</span>
      </figcaption>
    </figure>
  );
}
