"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { LogoFull } from "@/components/brand/logo";
import { BigLink } from "@/components/ui/action";
import { Icon, type IconName } from "@/components/ui/icons";
import { bookingHref, isCurrent, mainNavigation } from "@/config/navigation";
import { site } from "@/config/site";

/**
 * Mobiele navigatie in de kopregel: afspraakknop en menuknop. Het menu vult het
 * scherm, donker met goud zoals de footer: de pagina's, contact en de
 * afspraakknop onderaan, binnen bereik van de duim. Gebruikt het native
 * <dialog>-element voor focusbeheer en Escape.
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
        className="menu-overlay lg:hidden [&_:focus-visible]:outline-gold"
      >
        <div className="flex min-h-full flex-col">
          {/* Zelfde maat als de kopregel: het logo en de sluitknop staan waar logo en menuknop stonden. */}
          <div className="flex items-center justify-between gap-3 border-b border-sand/20 px-gutter py-1.5">
            <LogoFull className="w-[7.5rem]" sizes="120px" />
            <h2 id="mobiel-menu-titel" className="sr-only">
              Menu
            </h2>
            <button
              type="button"
              onClick={closeMenu}
              aria-label="Menu sluiten"
              className="flex size-11 items-center justify-center rounded-full border border-sand/40 text-ivory transition-colors duration-(--duration-quick) hover:border-gold hover:text-gold"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex flex-1 flex-col px-gutter pt-8 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <nav aria-label="Menu">
              <ul className="grid gap-1">
                {mainNavigation.map((item) => {
                  const current = pathname !== null && isCurrent(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={closeMenu}
                        aria-current={current ? "page" : undefined}
                        className={`flex items-center justify-between gap-4 py-2 text-display-s font-medium transition-colors duration-(--duration-quick) hover:text-gold ${
                          current ? "text-gold" : "text-ivory"
                        }`}
                      >
                        {item.label}
                        {current && (
                          <span aria-hidden="true" className="size-2 rounded-full bg-gold" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <ul className="mt-10 grid gap-3 text-sand">
              <li className="flex gap-3">
                <Icon name="pin" className="mt-0.5 text-gold" />
                <address className="text-ivory not-italic">
                  {site.address.street}, {site.address.postalCode} {site.address.city}
                </address>
              </li>
              <li className="flex gap-3">
                <Icon name="phone" className="mt-0.5 text-gold" />
                <a href={site.phone.href} className="figures text-ivory hover:text-gold">
                  {site.phone.display}
                </a>
              </li>
              <li className="flex gap-3">
                <Icon name="mail" className="mt-0.5 text-gold" />
                <a href={site.email.href} className="min-w-0 text-ivory [overflow-wrap:anywhere] hover:text-gold">
                  {site.email.display}
                </a>
              </li>
            </ul>

            <div className="mt-auto flex items-center gap-3 pt-10">
              {!onBookingPage && (
                <BigLink href={bookingHref} onClick={closeMenu} className="flex-1">
                  Afspraak maken
                </BigLink>
              )}
              <SocialButton href={site.instagram.href} label={`${site.name} op Instagram (${site.instagram.handle})`} icon="instagram" />
              <SocialButton href={site.facebook.href} label={`${site.name} op Facebook`} icon="facebook" />
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}

function SocialButton({ href, label, icon }: { href: string; label: string; icon: IconName }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label}, opent in een nieuw venster`}
      className="grid size-12 shrink-0 place-items-center rounded-full border border-sand/40 text-ivory transition-colors duration-(--duration-quick) hover:border-gold hover:text-gold"
    >
      <Icon name={icon} />
    </a>
  );
}
