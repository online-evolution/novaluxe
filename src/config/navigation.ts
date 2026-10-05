import type { Route } from "next";

export type NavItem = { href: Route; label: string };

export const mainNavigation: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/extensions", label: "Extensions" },
  { href: "/nagels", label: "Nagels" },
  { href: "/over-ons", label: "Over ons" },
  { href: "/contact", label: "Contact" },
];

/** Alle afspraakknoppen gaan naar dezelfde reserveringspagina (bron: R1). */
export const bookingHref: Route = "/reserveren";

export function isCurrent(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
