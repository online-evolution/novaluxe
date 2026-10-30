/** Snelle links naar de onderdelen van een lange pagina. */
export function PageLinks({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav aria-label="Op deze pagina" className="mt-8">
      <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-small font-medium">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="underline decoration-sand underline-offset-4 hover:text-bronze-deep">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
