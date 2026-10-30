import { Allura, Bodoni_Moda, Familjen_Grotesk } from "next/font/google";

/*
 * Familjen Grotesk voor tekst, navigatie en knoppen; Bodoni Moda voor de grote
 * koppen (zie docs/besluiten.md).
 */
export const familjen = Familjen_Grotesk({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-familjen",
  display: "swap",
});

export const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-bodoni",
  display: "swap",
});

/** Geschreven letter voor de quote van Jessie. Niet voor koppen of lopende tekst. */
export const scriptFont = Allura({ weight: "400", subsets: ["latin"], display: "swap" });
