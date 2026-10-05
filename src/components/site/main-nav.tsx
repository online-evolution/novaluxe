"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCurrent, mainNavigation } from "@/config/navigation";

/** Desktopnavigatie; markeert de huidige pagina. */
export function MainNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Hoofdmenu">
      <ul className="flex items-baseline gap-8">
        {mainNavigation.map((item) => {
          const current = isCurrent(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`text-small underline-offset-[6px] transition-colors duration-(--duration-quick) ${
                  current
                    ? "text-ink underline decoration-bronze"
                    : "text-ink-soft hover:text-ink"
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
