import { HomeAttention } from "@/components/home/home-attention";
import { HomeBooking } from "@/components/home/home-booking";
import { HomeHero } from "@/components/home/home-hero";
import { HomeJessie } from "@/components/home/home-jessie";
import { HomeTreatments } from "@/components/home/home-treatments";
import { HomeWork } from "@/components/home/home-work";

/*
 * Homepage: opening → Jessie → extensions en nagels → aandacht → werk →
 * afspraak → colofon. De achtergronden wisselen elkaar af: crème, ivoor, crème,
 * ivoor, brons en dan de ivoren footer. Houd dat kloppend als de volgorde
 * verandert. Teksten uit docs/bron.
 */
export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeJessie />
      <HomeTreatments />
      <HomeAttention />
      <HomeWork />
      <HomeBooking />
    </>
  );
}
