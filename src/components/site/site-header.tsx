import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { bookingHref } from "@/config/navigation";
import { site } from "@/config/site";
import { MainNav } from "./main-nav";

/**
 * Kopregel met het monogram van het logo, op hetzelfde ivoor als de opening van
 * de pagina.
 * Op mobiel staat daarnaast alleen de plaats; navigatie en afspraakknop zitten in
 * de balk onderin.
 */
export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-8 bg-ivory px-gutter pt-5 pb-3 lg:pt-6">
      <LogoMark className="h-11 w-auto lg:h-14" />

      <p className="label text-ink-soft lg:hidden">
        {site.area} · {site.address.city}
      </p>

      <div className="hidden items-center gap-14 lg:flex">
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
