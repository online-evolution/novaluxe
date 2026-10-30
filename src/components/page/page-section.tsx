import { SitePhoto } from "@/components/media/site-photo";

const tones = {
  cream: "bg-cream text-ink",
  ivory: "bg-ivory text-ink",
  bronze: "bg-bronze-deep text-cream",
};

/**
 * Blok op een pagina, in een van de huisstijlkleuren. Met een `shot` staat de
 * foto naast de tekst.
 */
export function PageSection({
  id,
  labelledBy,
  tone = "cream",
  shot,
  subject = "",
  landscape = false,
  children,
}: {
  id?: string;
  labelledBy: string;
  tone?: keyof typeof tones;
  shot?: string;
  subject?: string;
  /** Liggende foto (3:2): die krijgt meer breedte dan de tekst. */
  landscape?: boolean;
  children: React.ReactNode;
}) {
  const hasPhoto = Boolean(shot);

  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`scroll-mt-8 px-gutter py-section-tight ${tones[tone]} ${
        hasPhoto ? `grid items-center gap-12 lg:gap-16 ${landscape ? "lg:grid-cols-[2fr_3fr]" : "lg:grid-cols-2"}` : ""
      }`}
    >
      <div>{children}</div>
      {shot && (
        <SitePhoto
          shot={shot}
          subject={subject}
          className={`w-full ${landscape ? "aspect-[3/2]" : "aspect-[4/5]"}`}
          sizes={landscape ? "(min-width: 1024px) 56vw, 100vw" : "(min-width: 1024px) 46vw, 100vw"}
        />
      )}
    </section>
  );
}

export function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-display-m font-semibold text-balance">
      {children}
    </h2>
  );
}
