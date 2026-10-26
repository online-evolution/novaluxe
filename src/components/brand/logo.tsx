import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";
import fullLogo from "../../../public/brand/novaluxe-logo.png";
import monogram from "../../../public/brand/novaluxe-monogram.png";

/*
 * Het NovaLuxe-logo (bron: docs/bron/logo/novaluxe.svg). Het origineel is een
 * zware, getraceerde SVG; we tonen gerenderde afgeleiden die Next.js per
 * schermgrootte optimaliseert. Klein: het monogram (de letters "NOVA LUXE"
 * worden onleesbaar onder ±120 px breedte). Groot: het volledige logo.
 */

/** Monogram als link naar home, voor de kopregel. */
export function LogoMark({ className = "h-11 w-auto" }: { className?: string }) {
  return (
    <Link href="/" className="inline-block">
      <Image src={monogram} alt={`${site.name}, naar de homepage`} priority className={className} sizes="96px" />
    </Link>
  );
}

/** Volledig logo, bijvoorbeeld in de footer. */
export function LogoFull({ className = "w-56" }: { className?: string }) {
  return <Image src={fullLogo} alt={site.name} className={`h-auto ${className}`} sizes="(min-width: 1024px) 280px, 224px" />;
}
