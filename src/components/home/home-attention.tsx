import { PhotoPlaceholder } from "@/components/media/photo-placeholder";

/**
 * Rustpunt: een ivoren vlak over de volle breedte, met de kop als typografisch
 * moment en één klein beeld van de lege behandelplek (één klant tegelijk).
 */
export function HomeAttention() {
  return (
    <section aria-labelledby="home-aandacht" className="mt-section bg-ivory py-section">
      <div className="grid gap-12 px-gutter lg:grid-cols-12 lg:gap-8">
        <h2
          id="home-aandacht"
          className="text-display-l font-medium text-balance lg:col-span-7"
        >
          Alle aandacht voor jou
        </h2>
        <div className="lg:col-span-4 lg:col-start-9 lg:pt-3">
          <p className="text-lede">
            Tijdens jouw afspraak ben ik er helemaal voor jou. Ik behandel één klant
            tegelijk, zodat we rustig je wensen kunnen bespreken en kunnen bijpraten.
          </p>
          <p className="mt-5 text-ink-soft">
            Twijfel je ergens over? Vraag het gerust. Ik vertel je eerlijk wat past bij
            jouw haar of nagels.
          </p>
        </div>
        <PhotoPlaceholder
          shot="S01"
          subject="De behandelplek, leeg, met daglicht"
          className="reveal aspect-[3/2] w-4/5 lg:col-span-4 lg:col-start-2 lg:w-full"
        />
      </div>
    </section>
  );
}
