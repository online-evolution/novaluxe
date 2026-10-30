"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { isCurrent, mainNavigation } from "@/config/navigation";

/**
 * Desktopnavigatie; markeert de huidige pagina. Onder een route met een
 * onbekende parameter is het pad pas bij het verzoek bekend (Suspense).
 */
export function MainNav() {
  return (
    <Suspense fallback={<NavList pathname={null} />}>
      <CurrentNav />
    </Suspense>
  );
}

function CurrentNav() {
  return <NavList pathname={usePathname()} />;
}

function NavList({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Hoofdmenu">
      <ul className="flex items-center gap-8">
        {mainNavigation.map((item) => {
          const current = pathname !== null && isCurrent(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`font-medium underline-offset-[6px] transition-colors duration-(--duration-quick) ${
                  current
                    ? "text-ink underline decoration-bronze"
                    : "hover:text-bronze-deep"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
