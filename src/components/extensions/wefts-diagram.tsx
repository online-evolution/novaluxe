const rows = [175, 200, 225, 250];
const strands = Array.from({ length: 15 }, (_, index) => 112 + index * 9.7);

/**
 * Lijntekening van een achterhoofd: de rijen (banen) en de lengtes uit de
 * prijstabel. Verklaart de twee assen van de tabel zonder foto of icoon.
 */
export function WeftsDiagram({
  lengthsCm,
  className = "",
}: {
  /** Lengtes uit de prijstabel, zodat diagram en tabel altijd overeenkomen. */
  lengthsCm: number[];
  className?: string;
}) {
  const step = lengthsCm.length > 1 ? 150 / (lengthsCm.length - 1) : 0;
  const lengths = lengthsCm.map((cm, index) => ({ cm, y: 230 + index * step }));

  return (
    <svg
      viewBox="0 0 300 400"
      role="img"
      aria-labelledby="wefts-titel wefts-uitleg"
      className={`h-auto w-full ${className}`}
    >
      <title id="wefts-titel">Banen en lengte bij extensions</title>
      <desc id="wefts-uitleg">
        Achterhoofd met vier rijen wefts, genummerd één tot en met vier, en een
        schaal voor de lengte in centimeters ({lengthsCm.join(", ")}).
      </desc>

      {/* Haar */}
      <g className="stroke-ink/15" fill="none" strokeWidth="1">
        {strands.map((x) => {
          // Elke lijn begint op de kruinboog (middelpunt 180,152; straal 70).
          const top = 152 - Math.sqrt(Math.max(0, 70 ** 2 - (x - 180) ** 2));
          return (
            <path
              key={x}
              d={`M ${x} ${top.toFixed(1)} C ${x} 250, ${180 + (x - 180) * 0.82} 320, ${180 + (x - 180) * 0.78} 385`}
            />
          );
        })}
      </g>

      {/* Kruin */}
      <path
        d="M 110 152 A 70 70 0 0 1 250 152"
        fill="none"
        className="stroke-ink"
        strokeWidth="1.25"
      />

      {/* Banen */}
      <g fill="none" className="stroke-bronze-deep" strokeWidth="1.75" strokeLinecap="round">
        {rows.map((y) => (
          <path key={y} d={`M 114 ${y} Q 180 ${y + 14} 246 ${y}`} />
        ))}
      </g>
      <g className="fill-bronze-deep" fontSize="11" fontWeight="500">
        <text x="262" y="160">
          banen
        </text>
        {rows.map((y, index) => (
          <text key={y} x="262" y={y + 4}>
            {index + 1}
          </text>
        ))}
      </g>

      {/* Lengte */}
      <line x1="40" y1="172" x2="40" y2="384" className="stroke-ink/40" strokeWidth="1" />
      <g className="fill-ink-soft" fontSize="11">
        <text x="40" y="160" textAnchor="middle">
          cm
        </text>
        {lengths.map(({ cm, y }) => (
          <g key={cm}>
            <line x1="34" y1={y} x2="46" y2={y} className="stroke-ink/40" strokeWidth="1" />
            <text x="28" y={y + 4} textAnchor="end">
              {cm}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
