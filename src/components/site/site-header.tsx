import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { bookingHref } from "@/config/navigation";
import { site } from "@/config/site";
import { MainNav } from "./main-nav";

/**
 * Rustige kopregel zonder balk of achtergrondvlak. Op mobiel staat alleen het
 * woordbeeld met de plaats; navigatie en afspraakknop zitten in de balk onderin.
 */
export function SiteHeader() {
  return (
    <header className="flex items-baseline justify-between gap-8 px-gutter pt-6 pb-4 lg:pt-8">
      <Wordmark />

      <p className="label text-ink-soft lg:hidden">
        {site.area} · {site.address.city}
      </p>

      <div className="hidden items-baseline gap-14 lg:flex">
        <MainNav />
        <Link
          href={bookingHref}
          className="border-b border-ink pb-1 text-small font-medium transition-colors duration-(--duration-quick) hover:border-bronze-deep hover:text-bronze-deep"
        >
          Afspraak maken
        </Link>
      </div>
    </header>
  );
}
