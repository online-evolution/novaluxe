import { PhotoPlaceholder } from "@/components/media/photo-placeholder";
import { ActionLink } from "@/components/ui/action";

/**
 * Kennismaking: de kop over de volle breedte, het portret smal in het midden
 * en de tekst ernaast onderaan — bewust geen tekst-links/foto-rechts-blok.
 */
export function HomeJessie() {
  return (
    <section aria-labelledby="home-jessie" className="mt-section px-gutter">
      <h2 id="home-jessie" className="text-display-l font-medium text-balance">
        Maak kennis met Jessie
      </h2>
      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
        <PhotoPlaceholder
          shot="J01"
          subject="Portret van Jessie in de salon"
          className="reveal aspect-[4/5] w-[78%] sm:w-1/2 lg:col-span-4 lg:col-start-4 lg:w-full"
        />
        <div className="lg:col-span-4 lg:col-start-9">
          <p className="max-w-measure text-ink-soft">
            Wat begon met nagels zetten in een klein kamertje thuis, groeide uit tot
            mijn eigen salon in Kijkduin. Hier komen mijn liefde voor nagels en mijn
            ervaring met haar en extensions samen. Het leukste aan mijn werk blijft
            jouw reactie als je het resultaat ziet en blij de deur uitgaat.
          </p>
          <div className="mt-8">
            <ActionLink variant="quiet" href="/over-ons">
              Lees mijn verhaal
            </ActionLink>
          </div>
        </div>
      </div>
    </section>
  );
}
