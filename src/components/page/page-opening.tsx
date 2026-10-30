import { SitePhoto } from "@/components/media/site-photo";

/**
 * Opening van een pagina: gecentreerd op ivoor, zoals de homepage. Met een
 * `shot` staat de foto er over de volle hoogte naast.
 */
export function PageOpening({
  id,
  title,
  shot,
  subject = "",
  children,
}: {
  id: string;
  title: string;
  shot?: string;
  subject?: string;
  children: React.ReactNode;
}) {
  const hasPhoto = Boolean(shot);

  return (
    <section aria-labelledby={id} className={`grid bg-ivory ${hasPhoto ? "lg:grid-cols-[7fr_5fr]" : ""}`}>
      <div className="px-gutter pt-10 pb-section-tight text-center lg:self-center">
        <h1 id={id} className={`mx-auto max-w-[14em] font-semibold text-balance ${hasPhoto ? "text-display-m" : "text-display-l"}`}>
          {title}
        </h1>
        {children}
      </div>
      {shot && (
        <SitePhoto
          shot={shot}
          subject={subject}
          className="aspect-[4/5] lg:aspect-auto lg:min-h-[85dvh]"
          sizes="(min-width: 1024px) 42vw, 100vw"
          priority
        />
      )}
    </section>
  );
}
