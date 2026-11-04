import { PhotoClosing } from "@/components/page/photo-closing";
import { bookingHref } from "@/config/navigation";

/** Afsluiter vóór de footer, met de salonfoto van de opening (S04): de pagina eindigt waar hij begon. */
export function HomeBooking() {
  return (
    <PhotoClosing
      id="home-afspraak"
      shot="S04"
      title="Klaar voor nieuwe nagels of extensions?"
      href={bookingHref}
      label="Maak een afspraak"
    >
      Kies je behandeling en een moment dat jou uitkomt. Ik bekijk je aanvraag en laat je weten of het past.
    </PhotoClosing>
  );
}
