import type { Route } from "next";
import { BigLink } from "@/components/ui/action";
import { BronzeBackdrop } from "./bronze-backdrop";

/**
 * Afsluiter vóór de footer. De tekst staat in een boog zoals de spiegels in de
 * salon; daarin schuift een salonfoto (`shot`) in brons door de ruimte.
 */
export function PhotoClosing({
  id,
  shot,
  title,
  href,
  label,
  children,
}: {
  id: string;
  shot: string;
  title: string;
  href: Route;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="bg-bronze-deep px-gutter py-section-tight text-center text-cream">
      <div className="cta-boog relative isolate mx-auto max-w-[60rem] overflow-hidden px-6 pt-[clamp(7rem,20vw,12rem)] pb-16 sm:px-12 lg:pb-20">
        <BronzeBackdrop shot={shot} sizes="(min-width: 1024px) 960px, 100vw" />
        <h2 id={id} className="mx-auto max-w-[14em] text-display-m font-semibold text-balance">
          {title}
        </h2>
        <p className="mx-auto mt-6 max-w-measure text-lede">{children}</p>
        <BigLink href={href} className="mt-8">
          {label}
        </BigLink>
      </div>
    </section>
  );
}
