import { PageSection, SectionTitle } from "@/components/page/page-section";

/** Eén klant tegelijk: de tekst naast de foto van de lege behandelplek. */
export function HomeAttention() {
  return (
    <PageSection labelledBy="home-aandacht" shot="S01" subject="De behandelplek, leeg, met daglicht" landscape>
      <SectionTitle id="home-aandacht">Alle aandacht voor jou</SectionTitle>
      <p className="mt-8 max-w-measure text-lede">
        Tijdens jouw afspraak ben ik er helemaal voor jou. Ik behandel één klant tegelijk, zodat we rustig je wensen
        kunnen bespreken en kunnen bijpraten.
      </p>
      <p className="mt-5 max-w-measure text-lede">
        Twijfel je ergens over? Vraag het gerust. Ik vertel je eerlijk wat past bij jouw haar of nagels.
      </p>
    </PageSection>
  );
}
