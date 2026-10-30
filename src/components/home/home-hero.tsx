import Image from "next/image";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { focusPosition } from "@/components/media/focus";
import { PhotoPlaceholder } from "@/components/media/photo-placeholder";
import { bookingHref, mainNavigation } from "@/config/navigation";
import { site } from "@/config/site";
import { getSitePhotos } from "@/server/photos";

const subject = "De salon van NovaLuxe";
const goldPill =
  "inline-flex items-center rounded-full bg-[#d0a049] font-bold whitespace-nowrap text-ink transition-transform duration-(--duration-quick) hover:-translate-y-0.5";

/**
 * Opening: de salonfoto (S04) schuift langzaam door de ruimte, met een zwevende
 * glazen menubalk en de kop in het midden. Op mobiel blijft de foto liggend en
 * staat de tekst eronder.
 */
export async function HomeHero() {
  const photo = (await getSitePhotos()).S04;

  return (
    <section aria-labelledby="home-titel" className="relative bg-cream lg:h-dvh lg:min-h-[620px] lg:overflow-hidden">
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
          className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(38_26_19/0.4),transparent_30%)] lg:bg-[radial-gradient(70%_58%_at_50%_46%,rgb(38_26_19/0.74),rgb(38_26_19/0.46)_60%,rgb(38_26_19/0.2)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -bottom-px h-[22%] bg-gradient-to-t from-cream to-transparent lg:h-[30%]"
        />
      </div>

      <nav
        aria-label="Hoofdmenu"
        className="absolute inset-x-gutter top-4 z-10 flex items-center justify-between gap-5 rounded-full border border-cream/30 bg-cream/15 py-2 pr-2.5 pl-3.5 text-cream backdrop-blur-md backdrop-saturate-125"
      >
        <span className="flex items-center gap-2.5 font-semibold">
          <LogoMark className="h-9 w-auto" />
          {site.name}
        </span>
        <ul className="hidden gap-8 font-medium lg:flex">
          {mainNavigation
            .filter((item) => item.href !== "/")
            .map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:underline hover:underline-offset-4">
                  {item.label}
                </Link>
              </li>
            ))}
        </ul>
        <Link href={bookingHref} className={`${goldPill} px-5 py-2.5 text-small lg:text-body`}>
          Afspraak maken ↗
        </Link>
      </nav>

      <div className="relative z-10 px-gutter pt-2 pb-10 text-center lg:absolute lg:inset-x-0 lg:top-[48%] lg:-translate-y-1/2 lg:pt-0 lg:pb-0 lg:text-cream">
        <p className="inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-1.5 text-small font-semibold text-cream lg:bg-cream/90 lg:text-ink">
          <span aria-hidden="true" className="size-2 rounded-full bg-[#d0a049]" />
          Eén klant tegelijk · {site.address.street}, {site.address.city}
        </p>
        <h1
          id="home-titel"
          className="mx-auto mt-4 max-w-[10.5em] text-display-l font-semibold text-balance lg:text-[clamp(3.5rem,6.6vw,6rem)] lg:[text-shadow:0_2px_34px_rgb(30_20_14/0.5)]"
        >
          Extensions en nagels in {site.area}
        </h1>
        <p className="mx-auto mt-4 max-w-[38em] text-lede lg:[text-shadow:0_1px_16px_rgb(30_20_14/0.65)]">
          Wil je voller haar, extra lengte of een mooie nieuwe set nagels? Bij NovaLuxe in Kijkduin neem ik de tijd om te
          luisteren naar wat jij mooi vindt.
        </p>
        <p className="mx-auto mt-3 max-w-[38em] lg:[text-shadow:0_1px_16px_rgb(30_20_14/0.65)]">
          Je krijgt eerlijk advies en mijn volledige aandacht. Neem plaats, voel je op je gemak en geniet van een moment
          voor jezelf.
        </p>
        <Link href={bookingHref} className={`${goldPill} mt-5 px-8 py-3.5 text-lede`}>
          Maak een afspraak ↗
        </Link>
      </div>
    </section>
  );
}
