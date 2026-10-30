import { SitePhoto } from "@/components/media/site-photo";
import { BigLink } from "@/components/ui/action";
import { scriptFont } from "@/lib/fonts";

/**
 * Kennismaking met Jessie: tekst en een quote in haar eigen woorden, naast haar
 * portret.
 */
export function HomeJessie() {
  return (
    <section aria-labelledby="home-jessie" className="bg-cream px-gutter py-section-tight">
      <div className="mx-auto grid max-w-[76rem] items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <h2 id="home-jessie" className="text-display-m font-semibold text-balance">
            Maak kennis met <em>Jessie</em>
          </h2>
          <p className="mt-6 max-w-measure text-lede">
            Wat begon met nagels zetten in een klein kamertje thuis, groeide uit tot mijn eigen salon in Kijkduin. Hier
            komen mijn liefde voor nagels en mijn ervaring met haar en extensions samen.
          </p>
          <blockquote
            className={`${scriptFont.className} mt-8 max-w-[30em] border-l-2 border-gold pl-5 text-[clamp(1.85rem,1.5rem+1.3vw,2.5rem)] leading-tight text-pretty`}
          >
            Het mooiste moment is voor mij wanneer je in de spiegel kijkt en blij wordt van wat je ziet.
          </blockquote>
          <BigLink href="/over-ons" size="md" className="mt-8">
            Lees mijn verhaal
          </BigLink>
        </div>
        <SitePhoto
          shot="J01"
          subject="Portret van Jessie in de salon"
          className="mx-auto aspect-[4/5] w-3/4 sm:w-1/2 lg:col-span-5 lg:w-full"
          sizes="(min-width: 1024px) 460px, (min-width: 640px) 50vw, 75vw"
        />
      </div>
    </section>
  );
}
