import type { Metadata } from "next";
import { SitePhoto } from "@/components/media/site-photo";
import { DottedRow } from "@/components/page/dotted-row";
import { PageClosing } from "@/components/page/page-closing";
import { PageOpening } from "@/components/page/page-opening";
import { PageSection, SectionTitle } from "@/components/page/page-section";
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
 * Teksten uit docs/bron (Over ons). Persoonlijk verhaal, geen bedrijfspagina.
 * Foto's zijn optioneel: de pagina klopt ook zonder.
 */
export default function AboutPage() {
  return (
    <>
      <PageOpening
        id="verhaal-titel"
        title="Het verhaal van Jessie"
        shot="J04"
        subject="Portret van Jessie van dichtbij"
      >
        <p className="mx-auto mt-6 max-w-[34em] text-lede">
          NovaLuxe begon in een klein zijkamertje bij mij thuis. Ik deed mijn eigen nagels en die van vriendinnen en
          familie, gewoon omdat ik het leuk vond. Steeds meer mensen wisten mij te vinden. Wat begon als een hobby, groeide
          uit tot mijn eigen salon in Kijkduin.
        </p>
      </PageOpening>

      <section aria-labelledby="passie-titel" className="bg-cream px-gutter py-section-tight">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionTitle id="passie-titel">Mijn passie voor nagels en haar</SectionTitle>
            <p className="mt-8 max-w-measure">
              Ruim zes jaar geleden begon ik mezelf het nagelvak aan te leren. Sindsdien blijf ik nieuwe technieken en
              trends ontdekken, zodat ik voor iedere klant iets kan maken dat bij haar past.
            </p>
            <p className="mt-5 max-w-measure">
              Mijn liefde voor haar begon bij de kappersopleiding. Inmiddels heb ik zo’n vijf jaar ervaring in het
              kappersvak en werk ik ruim drie jaar als extensionspecialist. Extensions spraken mij al snel aan: met de
              juiste kleur, lengte en plaatsing kun je een groot verschil maken, terwijl het resultaat natuurlijk blijft
              ogen.
            </p>
          </div>
          <dl className="text-lede lg:self-center">
            {experience.map((item) => (
              <DottedRow key={item.craft} label={item.craft} value={item.years} />
            ))}
          </dl>
        </div>
        <SitePhoto
          shot="J02"
          subject="Jessie aan het werk, half van opzij"
          className="mx-auto mt-section-tight aspect-[4/5] w-3/4 sm:w-1/2 lg:w-1/3"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 75vw"
        />
      </section>

      <PageSection labelledBy="spiegel-titel" tone="bronze">
        <h2 id="spiegel-titel" className="text-lede font-semibold">
          Het moment voor de spiegel
        </h2>
        <p className="statement mt-5 max-w-[19em] text-display-m font-medium text-pretty">
          Het mooiste moment is voor mij wanneer je in de spiegel kijkt en blij wordt van wat je ziet. Die glimlach, of
          net wat meer zelfvertrouwen als je de deur uitgaat: daar doe ik het voor.
        </p>
      </PageSection>

      <PageSection labelledBy="salon-titel" tone="ivory" shot="S01" subject="De behandelplek, leeg, met daglicht" landscape>
        <SectionTitle id="salon-titel">Een salon waar je jezelf kunt zijn</SectionTitle>
        <p className="mt-8 max-w-measure">
          Ik run NovaLuxe zelf en help altijd één klant tegelijk. Tijdens jouw afspraak heb je dus mijn volledige aandacht.
          We kunnen rustig praten, je wensen bespreken en elkaar beter leren kennen. Ik wil vooral dat je je op je gemak
          voelt en alles durft te vragen.
        </p>
        <p className="mt-5 max-w-measure">
          Daar hoort voor mij ook eerlijk advies bij. Past een behandeling niet bij jouw haar of nagels, of is je gewenste
          resultaat niet haalbaar? Dan vertel ik je dat en zoeken we samen naar een passend alternatief.
        </p>
        <SitePhoto
          shot="S02"
          subject="Sfeerdetail: textiel, spiegel, licht"
          className="mt-10 aspect-square w-1/2 sm:w-1/3"
          sizes="(min-width: 640px) 33vw, 50vw"
        />
      </PageSection>

      <PageClosing id="gemak-titel" title="Je op je gemak voelen" href={bookingHref} label="Maak een afspraak">
        Een mooie behandeling voor een toegankelijke prijs: dat wil ik met NovaLuxe bieden. Ik vind het belangrijk dat je
        hier met plezier komt, eerlijk advies krijgt en tevreden naar huis gaat. Met mooie nagels of haar, en vooral met
        een goed gevoel over jezelf.
      </PageClosing>
    </>
  );
}
