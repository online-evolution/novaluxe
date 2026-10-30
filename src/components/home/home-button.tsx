import Link from "next/link";
import { bookingHref } from "@/config/navigation";

/** De grote afspraakknop van de homepage. */
export function HomeButton() {
  return (
    <Link
      href={bookingHref}
      className="inline-block bg-ink px-9 py-4 text-lede font-semibold text-cream transition-colors duration-(--duration-quick) hover:bg-bronze-deep focus-visible:bg-bronze-deep"
    >
      Maak een afspraak
    </Link>
  );
}
