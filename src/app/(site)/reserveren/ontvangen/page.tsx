import type { Metadata } from "next";
import { BigLink } from "@/components/ui/action";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Aanvraag ontvangen",
  robots: { index: false, follow: false },
};

/*
 * Bewust zonder details van de aanvraag (geen persoonsgegevens in de URL).
 * Tekst goedgekeurd: de afspraak is pas definitief na bevestiging door Jessie.
 */
export default function RequestReceivedPage() {
  return (
    <div className="bg-ivory px-gutter pt-10 pb-section-tight text-center">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-display-m font-semibold text-balance">
          Je afspraakaanvraag is ontvangen
        </h1>
        <p className="mx-auto mt-6 max-w-measure text-lede">
          Jessie controleert je aanvraag. Zodra zij deze bevestigt, ontvang je automatisch een e-mail.
        </p>
        <p className="mx-auto mt-5 max-w-measure text-ink-soft">
          Wil je iets wijzigen of heb je een vraag? Bel{" "}
          <a href={site.phone.href} className="figures underline decoration-bronze underline-offset-4">
            {site.phone.display}
          </a>
          .
        </p>
        <div className="mt-10">
          <BigLink href="/">Terug naar de homepage</BigLink>
        </div>
      </div>
    </div>
  );
}
