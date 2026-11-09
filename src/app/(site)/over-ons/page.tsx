import type { Metadata } from "next";
import { Facts } from "@/components/page/facts";
import { PageOpening } from "@/components/page/page-opening";
import { SectionTitle, SplitSection } from "@/components/page/page-section";
import { PhotoClosing } from "@/components/page/photo-closing";
import { bookingHref } from "@/config/navigation";
import { scriptFont } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Over Jessie",
  description:
    "NovaLuxe begon in een klein zijkamertje thuis en groeide uit tot een eigen salon in Kijkduin. Maak kennis met Jessie: nagels, haar en extensions, één klant tegelijk.",
};

/*
 * Ervaring zoals in de bron, letterlijk overgenomen (niet berekend).
 */
const experience = [
  { label: "Nagels", value: "Ruim zes jaar" },
  { label: "Kappersvak", value: "Zo’n vijf jaar" },
  { label: "Extensions", value: "Ruim drie jaar" },
];

/*
 * Teksten uit docs/bron (Over ons). Persoonlijk verhaal, geen bedrijfspagina.
 * Foto's zijn optioneel: de pagina klopt ook zonder. Opbouw zoals Extensions:
 * een opening in brons met de salonfoto (S01), daarna om en om crème en ivoor
 * met de foto afwisselend rechts en links, en een afsluiter in brons.
 */
export default function AboutPage() {
  return (
    <>
      <PageOpening id="verhaal-titel" title="Het verhaal van Jessie" backdrop="S01">
        <p className="mx-auto mt-6 max-w-[34em] text-lede">
          NovaLuxe begon in een klein zijkamertje bij mij thuis. Ik deed mijn eigen nagels en die van vriendinnen en
          familie, gewoon omdat ik het leuk vond. Steeds meer mensen wisten mij te vinden. Wat begon als een hobby, groeide
          uit tot mijn eigen salon in Kijkduin.
        </p>
      </PageOpening>

      <SplitSection labelledBy="passie-titel" shot="J02" subject="Jessie aan het werk, half van opzij">
        <SectionTitle id="passie-titel">Mijn passie voor nagels en haar</SectionTitle>
        <p className="mt-8 max-w-measure text-lede">
          Ruim zes jaar geleden begon ik mezelf het nagelvak aan te leren. Sindsdien blijf ik nieuwe technieken en trends
          ontdekken, zodat ik voor iedere klant iets kan maken dat bij haar past.
        </p>
        <p className="mt-5 max-w-measure text-lede">
          Mijn liefde voor haar begon bij de kappersopleiding. Inmiddels heb ik zo’n vijf jaar ervaring in het kappersvak
          en werk ik ruim drie jaar als extensionspecialist. Extensions spraken mij al snel aan: met de juiste kleur,
          lengte en plaatsing kun je een groot verschil maken, terwijl het resultaat natuurlijk blijft ogen.
        </p>
        <Facts items={experience} panel="ivory" columns={3} />
      </SplitSection>

      <SplitSection labelledBy="spiegel-titel" tone="ivory" shot="J04" subject="Portret van Jessie van dichtbij" photoFirst>
        <SectionTitle id="spiegel-titel">Het moment voor de spiegel</SectionTitle>
        <blockquote
          className={`${scriptFont.className} mt-8 max-w-[30em] border-l-2 border-gold pl-5 text-[clamp(1.85rem,1.5rem+1.3vw,2.5rem)] leading-tight text-pretty`}
        >
          Het mooiste moment is voor mij wanneer je in de spiegel kijkt en blij wordt van wat je ziet. Die glimlach, of net
          wat meer zelfvertrouwen als je de deur uitgaat: daar doe ik het voor.
        </blockquote>
      </SplitSection>

      <SplitSection labelledBy="salon-titel" shot="S02" subject="Sfeerdetail: textiel, spiegel, licht" square>
        <SectionTitle id="salon-titel">Een salon waar je jezelf kunt zijn</SectionTitle>
        <p className="mt-8 max-w-measure text-lede">
          Ik run NovaLuxe zelf en help altijd één klant tegelijk. Tijdens jouw afspraak heb je dus mijn volledige aandacht.
          We kunnen rustig praten, je wensen bespreken en elkaar beter leren kennen. Ik wil vooral dat je je op je gemak
          voelt en alles durft te vragen.
        </p>
        <p className="mt-5 max-w-measure text-lede">
          Daar hoort voor mij ook eerlijk advies bij. Past een behandeling niet bij jouw haar of nagels, of is je gewenste
          resultaat niet haalbaar? Dan vertel ik je dat en zoeken we samen naar een passend alternatief.
        </p>
      </SplitSection>

      <PhotoClosing id="gemak-titel" shot="S04" title="Je op je gemak voelen" href={bookingHref} label="Maak een afspraak">
        Een mooie behandeling voor een toegankelijke prijs: dat wil ik met NovaLuxe bieden. Ik vind het belangrijk dat je
        hier met plezier komt, eerlijk advies krijgt en tevreden naar huis gaat. Met mooie nagels of haar, en vooral met
        een goed gevoel over jezelf.
      </PhotoClosing>
    </>
  );
}
