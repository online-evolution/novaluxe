import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";
import fullLogo from "../../../public/brand/novaluxe-logo.png";

/*
 * Het NovaLuxe-logo (bron: docs/bron/logo/novaluxe.svg). Het origineel is een
 * zware, getraceerde SVG; we tonen gerenderde afgeleiden die Next.js per
 * schermgrootte optimaliseert. Onder ±120 px breedte worden de letters
 * "NOVA LUXE" onleesbaar; toon het volledige logo dus niet kleiner.
 */

/** Volledig logo als link naar home, voor de kopregel. */
export function LogoLink({ className = "w-36" }: { className?: string }) {
  return (
    <Link href="/" className="block shrink-0">
      <Image
        src={fullLogo}
        alt={`${site.name}, naar de homepage`}
        priority
        className={`h-auto ${className}`}
        sizes="144px"
      />
    </Link>
  );
}

/** Volledig logo, bijvoorbeeld in de footer. */
export function LogoFull({
  className = "w-56",
  sizes = "(min-width: 1024px) 280px, 224px",
  priority,
}: {
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return <Image src={fullLogo} alt={site.name} className={`h-auto ${className}`} sizes={sizes} priority={priority} />;
}
