import { PhotoPlaceholder } from "@/components/media/photo-placeholder";
import { site } from "@/config/site";

const frames = [
  { shot: "N02", subject: "Gellak in een mooie kleur", ratio: "aspect-[4/5]" },
  { shot: "E02", subject: "Extensions in een staart", ratio: "aspect-[3/4]" },
  { shot: "N06", subject: "Nail art met details", ratio: "aspect-square" },
  { shot: "E03", subject: "Overgang naar de eigen kleur", ratio: "aspect-[4/5]" },
  { shot: "N04", subject: "Acryl, lang en in vorm", ratio: "aspect-[3/4]" },
  { shot: "W03", subject: "Kleur matchen", ratio: "aspect-square" },
];

/**
 * Werk als contactafdrukvel: beelden in verschillende formaten op één
 * onderlijn, genummerd als op een film. Op mobiel horizontaal te vegen.
 */
export function HomeWork() {
  return (
    <section aria-labelledby="home-werk" className="mt-section">
      <div className="flex items-baseline justify-between gap-6 px-gutter">
        <h2 id="home-werk" className="text-display-s font-medium">
          Werk
        </h2>
        <a
          href={site.instagram.href}
          className="border-b border-line-strong pb-1 text-small font-medium hover:border-ink"
        >
          Bekijk Instagram <span className="text-ink-soft">{site.instagram.handle}</span>
        </a>
      </div>

      <div
        role="region"
        aria-label="Werk, horizontaal te scrollen"
        tabIndex={0}
        className="mt-8 snap-x snap-mandatory overflow-x-auto pb-4 [scrollbar-width:thin] focus-visible:outline-offset-[-2px] lg:overflow-visible"
      >
        <ol className="flex w-max items-end gap-4 px-gutter lg:grid lg:w-auto lg:grid-cols-6 lg:gap-6">
          {frames.map((frame, index) => (
            <li key={frame.shot} className="w-[62vw] shrink-0 snap-start sm:w-[38vw] lg:w-auto">
              <PhotoPlaceholder
                shot={frame.shot}
                subject={frame.subject}
                className={frame.ratio}
              />
              <p aria-hidden="true" className="label figures mt-2 text-ink-soft">
                {String(index + 1).padStart(2, "0")}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
