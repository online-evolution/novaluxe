import Image from "next/image";
import { BeforeAfter } from "@/components/media/before-after";
import { focusPosition } from "@/components/media/focus";
import { PhotoPlaceholder } from "@/components/media/photo-placeholder";
import { BigAnchor } from "@/components/ui/action";
import { site } from "@/config/site";
import { getGallery } from "@/server/photos";

/** Jessie fotografeert vooral staand: afwisselend staande verhoudingen, op één onderlijn. */
const photoRatios = ["aspect-[3/4]", "aspect-[4/5]", "aspect-[2/3]", "aspect-[4/5]"];

const placeholderFrames = [
  "Gellak in een mooie kleur",
  "Extensions in een staart",
  "Nail art met details",
  "Overgang naar de eigen kleur",
];

const maxPairs = 3;
const maxPhotos = 8;

/**
 * Werk: voor-en-na-paren als transformatie, daarna losse foto's. Zolang er nog geen werkfoto's zijn, staan hier de lege plekken.
 */
export async function HomeWork() {
  const { photos, pairs } = await getGallery();
  const shownPairs = pairs.slice(0, maxPairs);
  const shownPhotos = photos.slice(0, maxPhotos);

  return (
    <section aria-labelledby="home-werk" className="bg-ivory py-section-tight">
      <div className="flex flex-wrap items-center justify-between gap-4 px-gutter">
        <h2 id="home-werk" className="text-display-m font-semibold">
          Werk
        </h2>
        <BigAnchor href={site.instagram.href} size="md" target="_blank" rel="noopener noreferrer">
          Bekijk Instagram <span className="sr-only">(opent in een nieuw venster)</span>
        </BigAnchor>
      </div>

      {shownPairs.length > 0 && (
        <ul className="mt-8 grid gap-10 px-gutter sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
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
      )}

      {shownPhotos.length === 0 ? (
        <ol className="mt-8 grid grid-cols-2 items-end gap-4 px-gutter lg:grid-cols-4 lg:gap-6">
          {placeholderFrames.map((subject, index) => (
            <li key={subject}>
              <PhotoPlaceholder
                shot="Werk"
                subject={subject}
                className={`photo-arch ${photoRatios[index % photoRatios.length]}`}
              />
            </li>
          ))}
        </ol>
      ) : (
        <div
          role="region"
          aria-label="Werk, horizontaal te scrollen"
          tabIndex={0}
          className={`snap-x snap-mandatory scroll-px-gutter overflow-x-auto pb-4 [scrollbar-width:thin] focus-visible:outline-offset-[-2px] lg:overflow-visible ${
            shownPairs.length > 0 ? "mt-14" : "mt-8"
          }`}
        >
          <ol className="flex w-max items-end gap-4 px-gutter lg:grid lg:w-auto lg:grid-cols-4 lg:gap-6">
            {shownPhotos.map((photo, index) => (
              <li key={photo.id} className="w-[62vw] shrink-0 snap-start sm:w-[38vw] lg:w-auto">
                <figure>
                  <div className={`photo-arch relative overflow-hidden bg-ivory ${photoRatios[index % photoRatios.length]}`}>
                    <Image
                      src={photo.url}
                      alt={photo.alt ?? photo.caption ?? "Werk van NovaLuxe"}
                      fill
                      sizes="(min-width: 1024px) 23vw, (min-width: 640px) 38vw, 62vw"
                      className="object-cover"
                      style={{ objectPosition: focusPosition[photo.focus] }}
                    />
                  </div>
                  {photo.caption && <figcaption className="mt-2 text-small text-ink-soft">{photo.caption}</figcaption>}
                </figure>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
