import Link from "next/link";
import { SitePhoto } from "@/components/media/site-photo";

/**
 * Jessie in haar eigen woorden, naast haar portret, op het enige krachtige
 * kleurvlak van de pagina.
 */
export function HomeJessie() {
  return (
    <section
      aria-labelledby="home-jessie"
      className="grid items-end gap-12 bg-bronze-deep px-gutter py-section text-cream lg:grid-cols-12 lg:gap-8"
    >
      <div className="lg:col-span-8">
        <h2 id="home-jessie" className="text-lede font-semibold">
          Maak kennis met Jessie
        </h2>
        <blockquote className="mt-5 max-w-[19em] text-display-m font-medium text-pretty">
          Het mooiste moment is voor mij wanneer je in de spiegel kijkt en blij wordt van wat je ziet.
        </blockquote>
        <p className="mt-8 max-w-measure text-lede">
          Wat begon met nagels zetten in een klein kamertje thuis, groeide uit tot mijn eigen salon in Kijkduin. Hier
          komen mijn liefde voor nagels en mijn ervaring met haar en extensions samen.
        </p>
        <Link href="/over-ons" className="mt-5 inline-block font-semibold underline underline-offset-4">
          Lees mijn verhaal
        </Link>
      </div>
      <SitePhoto
        shot="J01"
        subject="Portret van Jessie in de salon"
        className="aspect-[4/5] w-3/4 sm:w-1/2 lg:col-span-4 lg:w-full"
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 75vw"
      />
    </section>
  );
}
