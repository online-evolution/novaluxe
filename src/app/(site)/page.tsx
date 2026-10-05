import { ActionLink } from "@/components/ui/action";
import { bookingHref } from "@/config/navigation";

/*
 * Tijdelijke homepage met de hero-tekst uit de bron. Het echte ontwerp volgt
 * in Fase 3.
 */
export default function HomePage() {
  return (
    <div className="px-gutter pt-section-tight">
      <h1 className="text-display-xl font-medium">
        <span className="block text-balance">Extensions en nagels</span>{" "}
        <span className="block md:pl-[18%]">in Kijkduin</span>
      </h1>
      <div className="mt-12 lg:ml-[50%]">
        <p className="max-w-measure text-lede">
          Wil je voller haar, extra lengte of een mooie nieuwe set nagels? Bij
          NovaLuxe in Kijkduin neem ik de tijd om te luisteren naar wat jij mooi
          vindt. Je krijgt eerlijk advies en mijn volledige aandacht. Neem plaats,
          voel je op je gemak en geniet van een moment voor jezelf.
        </p>
        <div className="mt-10">
          <ActionLink href={bookingHref}>Maak een afspraak</ActionLink>
        </div>
      </div>
    </div>
  );
}
