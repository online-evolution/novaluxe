import { HomeAttention } from "@/components/home/home-attention";
import { HomeBooking } from "@/components/home/home-booking";
import { HomeHero } from "@/components/home/home-hero";
import { HomeJessie } from "@/components/home/home-jessie";
import { HomeTreatments } from "@/components/home/home-treatments";
import { HomeWork } from "@/components/home/home-work";
import { getCatalog } from "@/server/catalog";

/*
 * Homepage als één verhaal: opening → twee hoofdstukken (haar, nagels) →
 * rustpunt (aandacht) → Jessie → werk → afspraak → colofon (footer).
 * Teksten uit docs/bron; prijzen uit de database.
 */
export default async function HomePage() {
  const catalog = await getCatalog();

  return (
    <>
      <HomeHero />
      <HomeTreatments catalog={catalog} />
      <HomeAttention />
      <HomeJessie />
      <HomeWork />
      <HomeBooking />
    </>
  );
}
