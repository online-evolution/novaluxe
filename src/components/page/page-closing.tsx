import type { Route } from "next";
import { BigLink } from "@/components/ui/action";

/** Afsluiter van een pagina vóór de footer: gecentreerd, met één knop. */
export function PageClosing({
  id,
  title,
  href,
  label,
  children,
}: {
  id: string;
  title: string;
  href: Route;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="bg-cream px-gutter py-section text-center">
      <h2 id={id} className="mx-auto max-w-[14em] text-display-m font-semibold text-balance">
        {title}
      </h2>
      <div className="mx-auto mt-6 max-w-measure text-lede">{children}</div>
      <div className="mt-8">
        <BigLink href={href}>{label}</BigLink>
      </div>
    </section>
  );
}
