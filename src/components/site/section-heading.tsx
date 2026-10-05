type SectionHeadingProps = {
  id: string;
  /** Hoofdstuknummer, gelijk aan de inhoudsopgave bovenaan de pagina. */
  number?: string;
  size?: "m" | "s";
  className?: string;
  children: React.ReactNode;
};

export function SectionHeading({
  id,
  number,
  size = "m",
  className = "",
  children,
}: SectionHeadingProps) {
  return (
    <div className={`flex items-baseline gap-4 ${className}`}>
      {number && (
        <span aria-hidden="true" className="label figures shrink-0 text-bronze-deep">
          {number}
        </span>
      )}
      <h2
        id={id}
        className={`font-medium text-balance ${size === "m" ? "text-display-m" : "text-display-s"}`}
      >
        {children}
      </h2>
    </div>
  );
}
