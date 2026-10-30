import { MobileBar } from "./mobile-bar";
import { SiteFooter } from "./site-footer";

/** Gedeelde omlijsting van de site. De homepage heeft het logo in de opening en dus geen kopregel. */
export function SiteShell({ header, children }: { header?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <a
        href="#inhoud"
        className="sr-only z-50 bg-ink px-4 py-3 text-small text-cream focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Naar de inhoud
      </a>
      {header}
      <main id="inhoud" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <MobileBar />
    </div>
  );
}
