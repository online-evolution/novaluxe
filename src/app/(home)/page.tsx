import { HomeBooking } from "@/components/home/home-booking";
import { HomeHero } from "@/components/home/home-hero";
import { HomeJessie } from "@/components/home/home-jessie";
import { HomePrices } from "@/components/home/home-prices";
import { HomeWork } from "@/components/home/home-work";
import { getCatalog } from "@/server/catalog";

/*
 * Homepage: opening met logo en één foto → prijskaart → Jessie → meer werk
 * (alleen als dat er is) → afspraak → colofon. Compleet met één foto; extra
 * foto's zijn een bonus. Teksten uit docs/bron; prijzen uit de database.
 */
export default async function HomePage() {
  const catalog = await getCatalog();

  return (
    <>
      <HomeHero />
      <HomePrices catalog={catalog} />
      <HomeJessie />
      <HomeWork />
      <HomeBooking />
    </>
  );
}
