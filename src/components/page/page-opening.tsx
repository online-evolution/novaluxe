import { SitePhoto } from "@/components/media/site-photo";

/**
 * Opening van een pagina: gecentreerd op ivoor, zoals de homepage. Met een
 * `shot` staat de foto er als boog naast.
 */
export function PageOpening({
  id,
  title,
  shot,
  subject = "",
  children,
}: {
  id: string;
  title: React.ReactNode;
  shot?: string;
  subject?: string;
  children: React.ReactNode;
}) {
  const hasPhoto = Boolean(shot);

  return (
    <section aria-labelledby={id} className={`grid items-center bg-ivory ${hasPhoto ? "pb-section-tight lg:grid-cols-[7fr_5fr] lg:pb-0" : ""}`}>
      <div className={`px-gutter pt-10 text-center ${hasPhoto ? "pb-10 lg:pb-section-tight" : "pb-section-tight"}`}>
        <h1 id={id} className={`mx-auto max-w-[14em] font-semibold text-balance ${hasPhoto ? "text-display-m" : "text-display-l"}`}>
          {title}
        </h1>
        {children}
      </div>
      {shot && (
        <SitePhoto
          shot={shot}
          subject={subject}
          className="mx-auto aspect-[4/5] w-3/4 max-w-md lg:my-section-tight"
          sizes="(min-width: 1024px) 448px, 75vw"
          priority
        />
      )}
    </section>
  );
}
