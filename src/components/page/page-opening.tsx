import { SitePhoto } from "@/components/media/site-photo";
import { BronzeBackdrop } from "./bronze-backdrop";

/**
 * Opening van een pagina: gecentreerd op ivoor, zoals de homepage. Met een
 * `shot` staat de foto er als boog naast; met een `backdrop` ligt de salonfoto
 * in brons achter de tekst, zoals in het afspraakblok onderaan.
 */
export function PageOpening({
  id,
  title,
  shot,
  subject = "",
  backdrop,
  children,
}: {
  id: string;
  title: string;
  shot?: string;
  subject?: string;
  backdrop?: string;
  children: React.ReactNode;
}) {
  if (backdrop) {
    return (
      <section
        aria-labelledby={id}
        className="relative isolate overflow-hidden px-gutter py-[clamp(5rem,12vw,9rem)] text-center text-cream"
      >
        <BronzeBackdrop shot={backdrop} sizes="100vw" />
        <h1 id={id} className="mx-auto max-w-[16em] text-display-m font-semibold text-balance">
          {title}
        </h1>
        {children}
      </section>
    );
  }

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
