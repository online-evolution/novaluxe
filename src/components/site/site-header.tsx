import Link from "next/link";
import { LogoLink } from "@/components/brand/logo";
import { goldPillClass } from "@/components/ui/action";
import { bookingHref } from "@/config/navigation";
import { site } from "@/config/site";
import { MainNav } from "./main-nav";

/**
 * Kopregel met het volledige logo, op hetzelfde ivoor als de opening van de pagina.
 * Op mobiel staat daarnaast alleen de plaats; navigatie en afspraakknop zitten in
 * de balk onderin.
 */
export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-8 bg-ivory px-gutter py-2">
      <LogoLink className="w-32 lg:w-36" />

      <p className="label text-ink-soft lg:hidden">
        {site.area} · {site.address.city}
      </p>

      <div className="hidden items-center gap-10 lg:flex">
        <MainNav />
        <Link href={bookingHref} className={`${goldPillClass} px-6 py-3`}>
          Afspraak maken
        </Link>
      </div>
    </header>
  );
}
