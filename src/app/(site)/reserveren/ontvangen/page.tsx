import type { Metadata } from "next";
import { ActionLink } from "@/components/ui/action";
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
    <div className="px-gutter pt-section-tight">
      <div className="mx-auto max-w-3xl">
        <p className="label text-bronze-deep">Afspraak aanvragen</p>
        <h1 className="mt-4 text-display-l font-medium text-balance">
          Je afspraakaanvraag is ontvangen
        </h1>
        <p className="mt-6 max-w-measure text-lede">
          Jessie controleert je aanvraag. Zodra zij deze bevestigt, ontvang je automatisch een e-mail.
        </p>
        <p className="mt-5 max-w-measure text-ink-soft">
          Wil je iets wijzigen of heb je een vraag? Bel{" "}
          <a href={site.phone.href} className="figures underline decoration-bronze underline-offset-4">
            {site.phone.display}
          </a>
          .
        </p>
        <div className="mt-10">
          <ActionLink variant="quiet" href="/">
            Terug naar de homepage
          </ActionLink>
        </div>
      </div>
    </div>
  );
}
