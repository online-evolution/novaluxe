import { Familjen_Grotesk } from "next/font/google";

/*
 * Huisletter: Familjen Grotesk, voor koppen én tekst (gekozen na de
 * typografiereview van Fase 1, zie docs/besluiten.md).
 */
export const familjen = Familjen_Grotesk({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-familjen",
  display: "swap",
});
