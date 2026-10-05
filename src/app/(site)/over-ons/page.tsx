import type { Metadata } from "next";
import { PhotoPlaceholder } from "@/components/media/photo-placeholder";
import { ActionLink } from "@/components/ui/action";
import { bookingHref } from "@/config/navigation";

export const metadata: Metadata = {
  title: "Over Jessie",
  description:
    "NovaLuxe begon in een klein zijkamertje thuis en groeide uit tot een eigen salon in Kijkduin. Maak kennis met Jessie: nagels, haar en extensions, één klant tegelijk.",
};

/*
 * Ervaring zoals in de bron, letterlijk overgenomen (niet berekend).
 */
const experience = [
  { craft: "Nagels", years: "Ruim zes jaar" },
  { craft: "Kappersvak", years: "Zo’n vijf jaar" },
  { craft: "Extensions", years: "Ruim drie jaar" },
];

/*
 * Teksten uit docs/bron (Over ons). Persoonlijk verhaal, geen bedrijfspagina:
 * portret, groei van kamertje naar salon, het moment voor de spiegel.
 */
export default function AboutPage() {
  return (
    <>
      {/* Opening */}
      <section aria-labelledby="verhaal-titel" className="px-gutter pt-section-tight">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <p className="label text-bronze-deep">Over NovaLuxe</p>
            <h1 id="verhaal-titel" className="mt-4 text-display-xl font-medium text-balance">
              Het verhaal van Jessie
            </h1>
          </div>
          <PhotoPlaceholder
            shot="J04"
            subject="Portret van Jessie van dichtbij"
            className="aspect-[3/4] w-3/4 justify-self-end sm:w-1/2 lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:w-full"
          />
          <p className="max-w-measure text-display-s font-medium text-pretty lg:col-span-6 lg:col-start-2 lg:row-start-2 lg:self-end lg:pt-10">
            NovaLuxe begon in een klein zijkamertje bij mij thuis. Ik deed mijn eigen
            nagels en die van vriendinnen en familie, gewoon omdat ik het leuk vond.
            Steeds meer mensen wisten mij te vinden. Wat begon als een hobby, groeide uit
            tot mijn eigen salon in Kijkduin.
          </p>
        </div>
      </section>

      {/* Ervaring en passie */}
      <section aria-labelledby="passie-titel" className="mt-section px-gutter">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <dl className="border-t border-line-strong lg:col-span-5">
            {experience.map((item) => (
              <div
                key={item.craft}
                className="flex items-baseline justify-between gap-6 border-b border-line py-5"
              >
                <dt className="text-ink-soft">{item.craft}</dt>
                <dd className="text-display-s font-medium">{item.years}</dd>
              </div>
            ))}
          </dl>
          <div className="lg:col-span-5 lg:col-start-8">
            <h2 id="passie-titel" className="text-display-m font-medium text-balance">
              Mijn passie voor nagels en haar
            </h2>
            <p className="mt-8 max-w-measure">
              Ruim zes jaar geleden begon ik mezelf het nagelvak aan te leren. Sindsdien
              blijf ik nieuwe technieken en trends ontdekken, zodat ik voor iedere klant
              iets kan maken dat bij haar past.
            </p>
            <p className="mt-5 max-w-measure text-ink-soft">
              Mijn liefde voor haar begon bij de kappersopleiding. Inmiddels heb ik zo’n
              vijf jaar ervaring in het kappersvak en werk ik ruim drie jaar als
              extensionspecialist. Extensions spraken mij al snel aan: met de juiste
              kleur, lengte en plaatsing kun je een groot verschil maken, terwijl het
              resultaat natuurlijk blijft ogen.
            </p>
          </div>
        </div>
        <PhotoPlaceholder
          shot="J02"
          subject="Jessie aan het werk, half van opzij"
          className="reveal -mx-gutter mt-section-tight aspect-[4/3] sm:aspect-[21/9]"
        />
      </section>

      {/* Het moment voor de spiegel */}
      <section aria-labelledby="spiegel-titel" className="mt-section bg-ivory px-gutter py-section">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <h2 id="spiegel-titel" className="label text-bronze-deep lg:col-span-3">
            Het moment voor de spiegel
          </h2>
          <p className="text-display-m font-medium text-balance lg:col-span-8 lg:col-start-4">
            Het mooiste moment is voor mij wanneer je in de spiegel kijkt en blij wordt
            van wat je ziet. Die glimlach, of net wat meer zelfvertrouwen als je de deur
            uitgaat: daar doe ik het voor.
          </p>
        </div>
      </section>

      {/* Een salon waar je jezelf kunt zijn */}
      <section aria-labelledby="salon-titel" className="mt-section px-gutter">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
          <div className="lg:col-span-5">
            <h2 id="salon-titel" className="text-display-m font-medium text-balance">
              Een salon waar je jezelf kunt zijn
            </h2>
            <p className="mt-8 max-w-measure">
              Ik run NovaLuxe zelf en help altijd één klant tegelijk. Tijdens jouw
              afspraak heb je dus mijn volledige aandacht. We kunnen rustig praten, je
              wensen bespreken en elkaar beter leren kennen. Ik wil vooral dat je je op je
              gemak voelt en alles durft te vragen.
            </p>
            <p className="mt-5 max-w-measure text-ink-soft">
              Daar hoort voor mij ook eerlijk advies bij. Past een behandeling niet bij
              jouw haar of nagels, of is je gewenste resultaat niet haalbaar? Dan vertel
              ik je dat en zoeken we samen naar een passend alternatief.
            </p>
          </div>
          <div className="grid grid-cols-5 items-end gap-4 lg:col-span-6 lg:col-start-7">
            <PhotoPlaceholder
              shot="S01"
              subject="De behandelplek, leeg, met daglicht"
              className="reveal col-span-3 aspect-[3/4]"
            />
            <PhotoPlaceholder
              shot="S02"
              subject="Sfeerdetail: textiel, spiegel, licht"
              className="reveal col-span-2 aspect-square"
            />
          </div>
        </div>
      </section>

      {/* Je op je gemak voelen */}
      <section aria-labelledby="gemak-titel" className="mt-section px-gutter">
        <div className="grid gap-10 border-t border-line-strong pt-section-tight lg:grid-cols-12 lg:gap-8">
          <h2 id="gemak-titel" className="text-display-l font-medium text-balance lg:col-span-6">
            Je op je gemak voelen
          </h2>
          <div className="lg:col-span-5 lg:col-start-8 lg:pt-3">
            <p className="max-w-measure text-lede">
              Een mooie behandeling voor een toegankelijke prijs: dat wil ik met NovaLuxe
              bieden. Ik vind het belangrijk dat je hier met plezier komt, eerlijk advies
              krijgt en tevreden naar huis gaat. Met mooie nagels of haar, en vooral met
              een goed gevoel over jezelf.
            </p>
            <div className="mt-10">
              <ActionLink href={bookingHref}>Maak een afspraak</ActionLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
