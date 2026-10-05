type PageIndexProps = {
  items: { id: string; label: string }[];
};

/**
 * Inhoudsopgave van een lange pagina, genummerd zoals het mobiele menu.
 * Geeft bezoekers op mobiel een snelle weg naar bijvoorbeeld de tarieven.
 */
export function PageIndex({ items }: PageIndexProps) {
  return (
    <nav aria-label="Op deze pagina" className="px-gutter">
      <ol className="grid border-t border-line-strong sm:grid-cols-2 lg:grid-cols-6">
        {items.map((item, index) => (
          <li key={item.id} className="border-b border-line">
            <a
              href={`#${item.id}`}
              className="flex items-baseline gap-4 py-3 transition-colors duration-(--duration-quick) hover:text-bronze-deep lg:pr-4"
            >
              <span aria-hidden="true" className="label figures text-bronze-deep">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-small font-medium">{item.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
