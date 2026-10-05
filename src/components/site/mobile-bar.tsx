"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { bookingHref, isCurrent, mainNavigation } from "@/config/navigation";
import { site } from "@/config/site";
import { actionClass } from "@/components/ui/action";

/**
 * Mobiele navigatie: een vaste balk onderin (binnen bereik van de duim) en een
 * menu dat van onderaf opent als genummerde inhoudsopgave. Gebruikt het
 * native <dialog>-element voor focusbeheer, Escape en de achtergrond.
 */
export function MobileBar() {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const onBookingPage = isCurrent(pathname, bookingHref);

  function openMenu() {
    dialogRef.current?.showModal();
    setOpen(true);
  }

  function closeMenu() {
    dialogRef.current?.close();
  }

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-0 z-40 grid border-t border-line bg-cream pb-[env(safe-area-inset-bottom)] lg:hidden ${
          onBookingPage ? "grid-cols-1" : "grid-cols-2"
        }`}
      >
        <button
          type="button"
          onClick={openMenu}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="mobiel-menu"
          className="flex h-14 items-center px-gutter text-small font-medium"
        >
          Menu
        </button>
        {!onBookingPage && (
          <Link
            href={bookingHref}
            className="flex h-14 items-center justify-center bg-ink px-4 text-small font-medium text-cream transition-colors duration-(--duration-quick) active:bg-bronze-deep"
          >
            Afspraak maken
          </Link>
        )}
      </div>

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
                const current = isCurrent(pathname, item.href);
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
              <a href={site.instagram.href} className="text-ink">
                {site.instagram.handle}
              </a>
            </p>
          </div>

          {!onBookingPage && (
            <Link
              href={bookingHref}
              onClick={closeMenu}
              className={`${actionClass("primary")} mt-8 w-full justify-center`}
            >
              Afspraak maken
            </Link>
          )}
        </div>
      </dialog>
    </>
  );
}
