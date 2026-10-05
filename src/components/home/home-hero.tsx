import { PhotoPlaceholder } from "@/components/media/photo-placeholder";
import { ActionLink } from "@/components/ui/action";
import { bookingHref } from "@/config/navigation";
import { site } from "@/config/site";

/**
 * Opening: de grote kop springt in, de foto loopt op mobiel van rand tot rand
 * en op desktop tot de rechterrand. Tekst en knop staan onderaan naast het beeld.
 */
export function HomeHero() {
  return (
    <section aria-labelledby="home-titel" className="pt-section-tight">
      <h1 id="home-titel" className="px-gutter text-display-xl font-medium">
        <span className="block text-balance">Extensions en nagels</span>{" "}
        <span className="block md:pl-[18%]">in Kijkduin</span>
      </h1>

      <div className="mt-10 grid gap-10 lg:mt-16 lg:grid-cols-12 lg:gap-8">
        <div className="order-2 px-gutter lg:order-1 lg:col-span-4 lg:self-end lg:pr-0">
          <p className="max-w-measure text-lede">
            Wil je voller haar, extra lengte of een mooie nieuwe set nagels? Bij
            NovaLuxe in Kijkduin neem ik de tijd om te luisteren naar wat jij mooi
            vindt.
          </p>
          <p className="mt-5 max-w-measure text-ink-soft">
            Je krijgt eerlijk advies en mijn volledige aandacht. Neem plaats, voel je
            op je gemak en geniet van een moment voor jezelf.
          </p>
          <div className="mt-10">
            <ActionLink href={bookingHref}>Maak een afspraak</ActionLink>
          </div>
          <p className="label mt-10 text-ink-soft">
            Eén klant tegelijk · {site.address.street}, {site.address.city}
          </p>
        </div>

        <PhotoPlaceholder
          shot="W01"
          subject="Detail: handen van Jessie aan het werk"
          className="order-1 aspect-[4/3] sm:aspect-[3/2] lg:order-2 lg:col-span-7 lg:col-start-6"
        />
      </div>
    </section>
  );
}
