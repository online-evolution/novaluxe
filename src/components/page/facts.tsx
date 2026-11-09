/**
 * Een paar korte feiten in vlakjes, zoals hoe vaak je terugkomt. `panel` is de
 * kleur van de vlakjes: kies de andere dan de achtergrond van het blok.
 */
export function Facts({
  items,
  panel = "cream",
  columns = 2,
}: {
  items: { label: string; value: string }[];
  panel?: "cream" | "ivory";
  columns?: 2 | 3;
}) {
  return (
    <dl className={`mt-10 grid max-w-measure gap-4 ${columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      {items.map((item) => (
        <div key={item.label} className={`px-6 py-5 ${panel === "cream" ? "bg-cream" : "bg-ivory"}`}>
          <dt className="text-small font-medium text-ink-soft">{item.label}</dt>
          <dd className="figures mt-1 text-lede font-semibold">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
