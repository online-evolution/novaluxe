import { LogoFull } from "@/components/brand/logo";
import { BeforeAfter } from "@/components/media/before-after";
import { SitePhoto } from "@/components/media/site-photo";
import { MainNav } from "@/components/site/main-nav";
import { BigLink } from "@/components/ui/action";
import { bookingHref } from "@/config/navigation";
import { site } from "@/config/site";
import { getGallery, getSitePhotos } from "@/server/photos";

const photoSizes = "(min-width: 1024px) 42vw, 100vw";

/**
 * Opening: het logo groot en gecentreerd, met daarnaast over de volle hoogte
 * één foto. Dat is het eerste voor en na (de transformatie), of anders de
 * vaste foto W01. Is er geen van beide, dan staat de tekst alleen. Meer foto's
 * zijn voor deze pagina niet nodig.
 */
export async function HomeHero() {
  const [{ pairs }, photos] = await Promise.all([getGallery(), getSitePhotos()]);
  const pair = pairs[0];
  const hasPhoto = Boolean(pair ?? photos.W01);

  return (
    <section aria-labelledby="home-titel" className={`grid bg-ivory lg:min-h-dvh ${hasPhoto ? "lg:grid-cols-[7fr_5fr]" : ""}`}>
      <div className="flex flex-col items-center gap-8 px-gutter pt-10 pb-12 text-center lg:justify-between lg:py-6">
        <div className="hidden lg:block">
          <MainNav />
        </div>
        <LogoFull
          className="w-[68vw] max-w-72 lg:w-[24vw] lg:max-w-80"
          sizes="(min-width: 1024px) 320px, 68vw"
          priority
        />
        <div>
          <h1 id="home-titel" className="mx-auto max-w-[13em] text-display-m font-semibold text-balance">
            Extensions en nagels in {site.area}
          </h1>
          <p className="mx-auto mt-5 max-w-measure text-lede">
            Wil je voller haar, extra lengte of een mooie nieuwe set nagels? Bij NovaLuxe in Kijkduin neem ik de tijd om
            te luisteren naar wat jij mooi vindt.
          </p>
          <div className="mt-8">
            <BigLink href={bookingHref}>Maak een afspraak</BigLink>
          </div>
          <p className="mt-5 text-small text-ink-soft">
            Eén klant tegelijk · {site.address.street}, {site.address.city}
          </p>
        </div>
      </div>

      {pair ? (
        <BeforeAfter
          before={pair.before}
          after={pair}
          alt={pair.alt ?? pair.caption ?? "Resultaat bij NovaLuxe"}
          caption={pair.caption}
          focus={pair.focus}
          sizes={photoSizes}
          className="lg:h-full"
          frameClassName="aspect-[4/5] lg:aspect-auto lg:h-full"
          showHint={false}
          priority
        />
      ) : (
        <SitePhoto
          shot="W01"
          subject="Detail: handen van Jessie aan het werk"
          className="aspect-[4/5] lg:aspect-auto lg:h-full"
          sizes={photoSizes}
          priority
        />
      )}
    </section>
  );
}
