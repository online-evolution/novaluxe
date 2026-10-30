import { LogoLink } from "@/components/brand/logo";
import { BigLink } from "@/components/ui/action";
import { bookingHref } from "@/config/navigation";
import { MainNav } from "./main-nav";
import { MobileMenu } from "./mobile-menu";

/**
 * Kopregel met het volledige logo, op hetzelfde ivoor als de opening van de pagina.
 * Blijft bovenaan staan tijdens het scrollen.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-ivory px-gutter py-1.5 lg:py-2">
      <LogoLink className="w-[7.5rem] lg:w-36" />

      <MobileMenu />

      <div className="hidden items-center gap-10 lg:flex">
        <MainNav />
        <BigLink href={bookingHref} size="md">
          Afspraak maken
        </BigLink>
      </div>
    </header>
  );
}
