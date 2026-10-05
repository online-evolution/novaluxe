export type NailTreatment = "manicure" | "biab" | "acryl";

const titles: Record<NailTreatment, string> = {
  manicure: "Manicure met gellak: een dunne kleurlaag op de eigen nagel",
  biab: "BIAB: een versterkende laag op de eigen nagel, zonder verlenging",
  acryl: "Acryl: een laag die de nagel verlengt voorbij de vingertop",
};

/**
 * Zijaanzicht van een vingertop in doorsnede. De eigen nagel is steeds
 * hetzelfde; alleen de laag erop verschilt. Zo zie je in één oogopslag het
 * verschil tussen manicure (gellak), BIAB en acryl.
 */
export function NailProfile({ treatment }: { treatment: NailTreatment }) {
  const titleId = `nagel-${treatment}`;
  return (
    <svg viewBox="0 0 260 140" role="img" aria-labelledby={titleId} className="h-auto w-full">
      <title id={titleId}>{titles[treatment]}</title>

      {/* Vingertop */}
      <path
        d="M 0 64 L 150 64 C 186 64 202 84 202 100 C 202 120 182 130 150 130 L 0 130"
        fill="none"
        className="stroke-ink/35"
        strokeWidth="1.25"
      />

      {/* Laag (achter de nagellijn, zodat de eigen nagel zichtbaar blijft) */}
      {treatment === "manicure" && (
        <path
          d="M 96 57 C 140 50 182 52 199 69"
          fill="none"
          className="stroke-bronze"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
      {treatment === "biab" && (
        <path
          d="M 96 61 C 122 42 172 42 200 72 L 199 74 C 182 56 140 54 96 61 Z"
          className="fill-bronze/35 stroke-bronze"
          strokeWidth="1"
        />
      )}
      {treatment === "acryl" && (
        <path
          d="M 96 61 C 128 40 196 38 246 58 L 245 64 C 206 54 150 54 96 61 Z"
          className="fill-bronze/35 stroke-bronze"
          strokeWidth="1"
        />
      )}

      {/* Eigen nagel */}
      <path
        d="M 96 61 C 140 54 182 56 199 72"
        fill="none"
        className="stroke-ink"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
