import { LogoFull } from "@/components/brand/logo";
import { SitePhoto } from "@/components/media/site-photo";
import { MainNav } from "@/components/site/main-nav";
import { BigLink } from "@/components/ui/action";
import { bookingHref } from "@/config/navigation";
import { site } from "@/config/site";

/**
 * Opening: links het logo met de tekst, rechts de salonfoto (S04). Die is
 * liggend en staat er helemaal op, zonder bijsnijden.
 */
export function HomeHero() {
  return (
    <section aria-labelledby="home-titel" className="bg-ivory">
      <div className="hidden justify-center pt-6 lg:flex">
        <MainNav />
      </div>
      <div className="grid items-center gap-10 px-gutter pt-10 pb-section-tight lg:grid-cols-[5fr_7fr] lg:gap-12 lg:pt-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <LogoFull
            className="w-[60vw] max-w-64 lg:max-w-72"
            sizes="(min-width: 1024px) 288px, 60vw"
            priority
          />
          <div>
            <h1 id="home-titel" className="mx-auto max-w-[13em] text-display-m font-semibold text-balance">
              Extensions en nagels in {site.area}
            </h1>
            <p className="mx-auto mt-4 max-w-measure text-lede">
              Wil je voller haar, extra lengte of een mooie nieuwe set nagels? Bij NovaLuxe in Kijkduin neem ik de tijd om
              te luisteren naar wat jij mooi vindt.
            </p>
            <div className="mt-6">
              <BigLink href={bookingHref}>Maak een afspraak</BigLink>
            </div>
            <p className="mt-4 text-small text-ink-soft">
              Eén klant tegelijk · {site.address.street}, {site.address.city}
            </p>
          </div>
        </div>
        <SitePhoto
          shot="S04"
          subject="De salon van NovaLuxe"
          className="aspect-[3/2] w-full"
          sizes="(min-width: 1024px) 58vw, 100vw"
          quality={90}
          priority
        />
      </div>
    </section>
  );
}
