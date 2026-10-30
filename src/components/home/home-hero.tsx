import Image from "next/image";
import Link from "next/link";
import { focusPosition } from "@/components/media/focus";
import { PhotoPlaceholder } from "@/components/media/photo-placeholder";
import { bookingHref } from "@/config/navigation";
import { site } from "@/config/site";
import { getSitePhotos } from "@/server/photos";

const subject = "De salon van NovaLuxe";
const goldPill =
  "inline-flex items-center rounded-full bg-[#d0a049] font-bold whitespace-nowrap text-ink transition-transform duration-(--duration-quick) hover:-translate-y-0.5";

/**
 * Opening: de salonfoto (S04) schuift langzaam door de ruimte, met de kop in het
 * midden. Op mobiel blijft de foto liggend en staat de tekst eronder.
 */
export async function HomeHero() {
  const photo = (await getSitePhotos()).S04;

  return (
    <section aria-labelledby="home-titel" className="relative bg-cream lg:h-[calc(100dvh-5.75rem)] lg:min-h-[600px] lg:overflow-hidden">
      <div className="relative aspect-[3/2] overflow-hidden bg-sand lg:absolute lg:inset-0 lg:aspect-auto">
        {photo ? (
          <Image
            src={photo.url}
            alt={photo.alt ?? subject}
            fill
            sizes="120vw"
            quality={90}
            priority
            className="hero-pan object-cover"
            style={{ objectPosition: focusPosition[photo.focus] }}
          />
        ) : (
          <PhotoPlaceholder shot="S04" subject={subject} className="h-full" />
        )}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <div className="hero-licht" />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden lg:block lg:bg-[radial-gradient(70%_58%_at_50%_46%,rgb(38_26_19/0.74),rgb(38_26_19/0.46)_60%,rgb(38_26_19/0.2)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -bottom-px h-[22%] bg-gradient-to-t from-cream to-transparent lg:h-[30%]"
        />
      </div>

      <div className="relative z-10 px-gutter pt-4 pb-10 text-center lg:absolute lg:inset-x-0 lg:top-[48%] lg:-translate-y-1/2 lg:pt-0 lg:pb-0 lg:text-cream">
        <h1
          id="home-titel"
          className="mx-auto max-w-[10.5em] text-display-l font-semibold text-balance lg:text-[clamp(3.5rem,6.6vw,6rem)] lg:[text-shadow:0_2px_34px_rgb(30_20_14/0.5)]"
        >
          Extensions en nagels in {site.area}
        </h1>
        <p className="mx-auto mt-4 max-w-[38em] text-lede lg:[text-shadow:0_1px_16px_rgb(30_20_14/0.65)]">
          Wil je voller haar, extra lengte of een mooie nieuwe set nagels? Bij NovaLuxe in Kijkduin neem ik de tijd om te
          luisteren naar wat jij mooi vindt.
        </p>
        <Link href={bookingHref} className={`${goldPill} mt-6 px-8 py-3.5 text-lede`}>
          Maak een afspraak ↗
        </Link>
      </div>
    </section>
  );
}
