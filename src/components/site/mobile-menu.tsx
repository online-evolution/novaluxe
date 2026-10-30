"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { BigLink } from "@/components/ui/action";
import { bookingHref, isCurrent, mainNavigation } from "@/config/navigation";
import { site } from "@/config/site";

/**
 * Mobiele navigatie in de kopregel: afspraakknop en menuknop. Het menu opent van
 * onderaf als genummerde inhoudsopgave, binnen bereik van de duim. Gebruikt het
 * native <dialog>-element voor focusbeheer, Escape en de achtergrond.
 */
export function MobileMenu() {
  // Onder een route met een onbekende parameter (zoals een vrijgavelink) is het
  // pad pas bij het verzoek bekend; tot dan zonder actieve pagina.
  return (
    <Suspense fallback={<Menu pathname={null} />}>
      <CurrentMenu />
    </Suspense>
  );
}

function CurrentMenu() {
  return <Menu pathname={usePathname()} />;
}

function Menu({ pathname }: { pathname: string | null }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const onBookingPage = pathname !== null && isCurrent(pathname, bookingHref);

  function openMenu() {
    dialogRef.current?.showModal();
    setOpen(true);
  }

  function closeMenu() {
    dialogRef.current?.close();
  }

  return (
    <div className="flex items-center gap-2 lg:hidden">
      {!onBookingPage && (
        <BigLink href={bookingHref} size="sm" arrow={false}>
          Afspraak
        </BigLink>
      )}
      <button
        type="button"
        onClick={openMenu}
        aria-label="Menu openen"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="mobiel-menu"
        className="flex size-11 items-center justify-center rounded-full bg-ink text-cream"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 8h16M4 16h16" strokeLinecap="round" />
        </svg>
      </button>

      <dialog
        id="mobiel-menu"
        ref={dialogRef}
        aria-labelledby="mobiel-menu-titel"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // Klik op de achtergrond (buiten de inhoud) sluit het menu.
          if (event.target === event.currentTarget) closeMenu();
        }}
        className="sheet lg:hidden"
      >
        <div className="px-gutter pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <div className="flex items-baseline justify-between border-b border-line pb-4">
            <h2 id="mobiel-menu-titel" className="label text-ink-soft">
              Menu
            </h2>
            <button
              type="button"
              onClick={closeMenu}
              className="text-small font-medium underline decoration-line-strong underline-offset-4"
            >
              Sluiten
            </button>
          </div>

          <nav aria-label="Menu">
            <ol>
              {mainNavigation.map((item, index) => {
                const current = pathname !== null && isCurrent(pathname, item.href);
                return (
                  <li key={item.href} className="border-b border-line">
                    <Link
                      href={item.href}
                      onClick={closeMenu}
                      aria-current={current ? "page" : undefined}
                      className="flex items-baseline gap-5 py-3"
                    >
                      <span aria-hidden="true" className="label figures w-6 text-bronze-deep">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`text-display-s font-medium ${
                          current ? "underline decoration-bronze decoration-1 underline-offset-8" : ""
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="mt-8 grid grid-cols-2 gap-4 text-small text-ink-soft">
            <address className="not-italic">
              {site.address.street}
              <br />
              {site.address.postalCode} {site.address.city}
            </address>
            <p className="flex flex-col">
              <a href={site.phone.href} className="figures text-ink">
                {site.phone.display}
              </a>
              <a href={site.instagram.href} target="_blank" rel="noopener noreferrer" className="text-ink">
                {site.instagram.handle} <span className="sr-only">(opent in een nieuw venster)</span>
              </a>
              <a href={site.facebook.href} target="_blank" rel="noopener noreferrer" className="text-ink">
                Facebook <span className="sr-only">(opent in een nieuw venster)</span>
              </a>
            </p>
          </div>

          {!onBookingPage && (
            <BigLink href={bookingHref} onClick={closeMenu} className="mt-8 w-full">
              Afspraak maken
            </BigLink>
          )}
        </div>
      </dialog>
    </div>
  );
}
