import Link from "next/link";
import { site } from "@/config/site";

type WordmarkProps = {
  className?: string;
};

/**
 * Tijdelijk woordbeeld in de huisletter, als link naar home.
 * TODO(logo): vervangen door het aangeleverde logobestand (SVG) zodra dat er is.
 */
export function Wordmark({ className = "" }: WordmarkProps) {
  return (
    <Link
      href="/"
      className={`text-[1.375rem] leading-none font-medium tracking-[-0.03em] ${className}`}
    >
      {site.name}
      <span className="sr-only">, naar de homepage</span>
    </Link>
  );
}
