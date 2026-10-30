import { HomeAttention } from "@/components/home/home-attention";
import { HomeBooking } from "@/components/home/home-booking";
import { HomeHero } from "@/components/home/home-hero";
import { HomeJessie } from "@/components/home/home-jessie";
import { HomePrices } from "@/components/home/home-prices";
import { HomeTreatments } from "@/components/home/home-treatments";
import { HomeWork } from "@/components/home/home-work";
import { getCatalog } from "@/server/catalog";

/*
 * Homepage: opening met logo en foto → extensions en nagels → prijskaart →
 * aandacht → Jessie → werk → afspraak → colofon. Teksten uit docs/bron; prijzen
 * uit de database.
 */
export default async function HomePage() {
  const catalog = await getCatalog();

  return (
    <>
      <HomeHero />
      <HomeTreatments />
      <HomePrices catalog={catalog} />
      <HomeAttention />
      <HomeJessie />
      <HomeWork />
      <HomeBooking />
    </>
  );
}
