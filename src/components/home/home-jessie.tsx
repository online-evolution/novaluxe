import Link from "next/link";
import { SitePhoto } from "@/components/media/site-photo";

/**
 * Kennismaking met Jessie: tekst en een quote in haar eigen woorden, naast haar
 * portret.
 */
export function HomeJessie() {
  return (
    <section
      aria-labelledby="home-jessie"
      className="grid items-center gap-12 bg-cream px-gutter py-section lg:grid-cols-12 lg:gap-8"
    >
      <div className="lg:col-span-8">
        <h2 id="home-jessie" className="text-display-m font-semibold text-balance">
          Maak kennis met Jessie
        </h2>
        <p className="mt-6 max-w-measure text-lede">
          Wat begon met nagels zetten in een klein kamertje thuis, groeide uit tot mijn eigen salon in Kijkduin. Hier
          komen mijn liefde voor nagels en mijn ervaring met haar en extensions samen.
        </p>
        <blockquote className="mt-8 max-w-[30em] border-l-2 border-gold pl-5 text-[clamp(1.3rem,1.1rem+0.8vw,1.75rem)] leading-snug font-medium text-pretty">
          Het mooiste moment is voor mij wanneer je in de spiegel kijkt en blij wordt van wat je ziet.
        </blockquote>
        <Link href="/over-ons" className="mt-8 inline-block font-semibold underline underline-offset-4 hover:text-bronze-deep">
          Lees mijn verhaal
        </Link>
      </div>
      <SitePhoto
        shot="J01"
        subject="Portret van Jessie in de salon"
        className="mx-auto aspect-[4/5] w-3/4 sm:w-1/2 lg:col-span-4 lg:w-full"
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 75vw"
      />
    </section>
  );
}
