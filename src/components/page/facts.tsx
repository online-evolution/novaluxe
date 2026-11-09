/**
 * Een paar korte feiten naast elkaar, zoals hoe vaak je terugkomt. Met het
 * gouden sterretje uit het logo, net als de verzorgingstips; zonder vlakken.
 */
export function Facts({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="mt-10 flex max-w-measure flex-wrap gap-x-12 gap-y-6">
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline gap-3">
          <span aria-hidden="true" className="text-lede text-gold">
            ✦
          </span>
          <div>
            <dt className="text-small text-ink-soft">{item.label}</dt>
            <dd className="figures text-lede font-semibold">{item.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
