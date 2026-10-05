import { ActionLink } from "@/components/ui/action";
import { bookingHref } from "@/config/navigation";

const steps = [
  "Kies je behandeling",
  "Kies een datum en tijd",
  "Jessie bevestigt je aanvraag",
];

/**
 * Afsluiter vóór de footer: hoe een afspraak aanvragen werkt. Maakt duidelijk
 * dat Jessie eerst bevestigt, zonder het als direct definitief te presenteren.
 */
export function HomeBooking() {
  return (
    <section aria-labelledby="home-afspraak" className="mt-section px-gutter">
      <div className="grid gap-10 border-t border-line-strong pt-section-tight lg:grid-cols-12 lg:gap-8">
        <h2
          id="home-afspraak"
          className="text-display-l font-medium text-balance lg:col-span-6"
        >
          Klaar voor je volgende afspraak
        </h2>
        <div className="lg:col-span-5 lg:col-start-8 lg:pt-3">
          <p className="max-w-measure text-lede">
            Weet je al waarvoor je wilt komen? Via de reserveringspagina kies je jouw
            nagel- of extensionsbehandeling en een beschikbare datum en tijd.
          </p>
          <ol className="mt-8 border-t border-line">
            {steps.map((step, index) => (
              <li key={step} className="flex items-baseline gap-5 border-b border-line py-3">
                <span aria-hidden="true" className="label figures w-5 text-bronze-deep">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-small text-ink-soft">
            Zodra Jessie je aanvraag bevestigt, ontvang je automatisch een e-mail.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
            <ActionLink href={bookingHref}>Maak een afspraak</ActionLink>
            <ActionLink variant="quiet" href="/reserveren?behandeling=gratis-consult">
              Plan je gratis consult
            </ActionLink>
          </div>
        </div>
      </div>
    </section>
  );
}
