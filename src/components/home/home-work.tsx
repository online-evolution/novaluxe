import Image from "next/image";
import { BeforeAfter } from "@/components/media/before-after";
import { focusPosition } from "@/components/media/focus";
import { PhotoPlaceholder } from "@/components/media/photo-placeholder";
import { site } from "@/config/site";
import { getGallery } from "@/server/photos";

const placeholderFrames = [
  { shot: "N02", subject: "Gellak in een mooie kleur", ratio: "aspect-[4/5]" },
  { shot: "E02", subject: "Extensions in een staart", ratio: "aspect-[3/4]" },
  { shot: "N06", subject: "Nail art met details", ratio: "aspect-square" },
  { shot: "E03", subject: "Overgang naar de eigen kleur", ratio: "aspect-[4/5]" },
  { shot: "N04", subject: "Acryl, lang en in vorm", ratio: "aspect-[3/4]" },
  { shot: "W03", subject: "Kleur matchen", ratio: "aspect-square" },
];

/** Jessie fotografeert vooral staand: afwisselend staande verhoudingen, op één onderlijn. */
const photoRatios = ["aspect-[3/4]", "aspect-[4/5]", "aspect-[2/3]", "aspect-[4/5]"];

const maxPairs = 3;
const maxPhotos = 8;

/**
 * Werk: eerst voor en na (schuiven om het verschil te zien), daarna losse
 * foto's als contactafdrukvel, genummerd als op een film. Op mobiel is de
 * strook horizontaal te vegen. Wat Jessie nog niet heeft geplaatst, staat er
 * als lege fotoplek.
 */
export async function HomeWork() {
  const { photos, pairs } = await getGallery();
  const shownPairs = pairs.slice(0, maxPairs);
  const shownPhotos = photos.slice(0, maxPhotos);

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

      {shownPairs.length > 0 && (
        <div className="mt-8 px-gutter">
          <p className="text-small text-ink-soft">Voor en na</p>
          <ul className="mt-5 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {shownPairs.map((pair) => (
              <li key={pair.id}>
                <BeforeAfter
                  before={pair.before}
                  after={pair}
                  alt={pair.alt ?? pair.caption ?? "Resultaat bij NovaLuxe"}
                  caption={pair.caption}
                  focus={pair.focus}
                  sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        role="region"
        aria-label="Werk, horizontaal te scrollen"
        tabIndex={0}
        className={`snap-x snap-mandatory scroll-px-gutter overflow-x-auto pb-4 [scrollbar-width:thin] focus-visible:outline-offset-[-2px] lg:overflow-visible ${
          shownPairs.length > 0 ? "mt-14" : "mt-8"
        }`}
      >
        {shownPhotos.length > 0 ? (
          <ol className="flex w-max items-end gap-4 px-gutter lg:grid lg:w-auto lg:grid-cols-4 lg:gap-6">
            {shownPhotos.map((photo, index) => (
              <li key={photo.id} className="w-[62vw] shrink-0 snap-start sm:w-[38vw] lg:w-auto">
                <figure>
                  <div className={`relative overflow-hidden bg-ivory ${photoRatios[index % photoRatios.length]}`}>
                    <Image
                      src={photo.url}
                      alt={photo.alt ?? photo.caption ?? "Werk van NovaLuxe"}
                      fill
                      sizes="(min-width: 1024px) 23vw, (min-width: 640px) 38vw, 62vw"
                      className="object-cover"
                      style={{ objectPosition: focusPosition[photo.focus] }}
                    />
                  </div>
                  <figcaption className="mt-2 flex items-baseline gap-3 text-small text-ink-soft">
                    <span aria-hidden="true" className="label figures">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {photo.caption}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ol>
        ) : (
          <ol className="flex w-max items-end gap-4 px-gutter lg:grid lg:w-auto lg:grid-cols-6 lg:gap-6">
            {placeholderFrames.map((frame, index) => (
              <li key={frame.shot} className="w-[62vw] shrink-0 snap-start sm:w-[38vw] lg:w-auto">
                <PhotoPlaceholder shot={frame.shot} subject={frame.subject} className={frame.ratio} />
                <p aria-hidden="true" className="label figures mt-2 text-ink-soft">
                  {String(index + 1).padStart(2, "0")}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
