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
  children,
}: {
  id?: string;
  labelledBy: string;
  tone?: keyof typeof tones;
  shot?: string;
  subject?: string;
  children: React.ReactNode;
}) {
  const hasPhoto = Boolean(shot);

  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`scroll-mt-8 px-gutter py-section-tight ${tones[tone]} ${
        hasPhoto ? "grid items-center gap-12 lg:grid-cols-2 lg:gap-16" : ""
      }`}
    >
      <div>{children}</div>
      {shot && (
        <SitePhoto
          shot={shot}
          subject={subject}
          className="aspect-[4/5] w-full"
          sizes="(min-width: 1024px) 46vw, 100vw"
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
