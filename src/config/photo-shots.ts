/*
 * Vaste fotoplekken op de website, met de shotcodes uit PHOTO-SHOTLIST.md.
 * Eén foto per code; staat een code op meer pagina's, dan verschijnt daar
 * dezelfde foto. De foto's van het werk en voor en na staan hier niet: die
 * beheert Jessie als verzameling.
 */

/** Verhouding breedte:hoogte. Houd gelijk aan de aspect-klasse van de plek op de site. */
export type PhotoRatio = "4:5" | "3:4" | "2:3" | "1:1";

export type PhotoShot = {
  code: string;
  subject: string;
  /** Waar de foto op de site staat, in woorden voor het beheer. */
  where: string;
  /** Staat een code op twee plekken met een andere verhouding, dan de meest passende. */
  ratio: PhotoRatio;
};

export const photoShots: PhotoShot[] = [
  { code: "W01", subject: "Handen van Jessie aan het werk aan nagels", where: "Homepage, bovenaan, zolang er geen voor en na is", ratio: "4:5" },
  { code: "J01", subject: "Portret van Jessie in de salon", where: "Homepage, naast de tekst van Jessie (optioneel)", ratio: "4:5" },
  { code: "E01", subject: "Extensions van achteren, lang haar met een natuurlijke val", where: "Extensions, bovenaan", ratio: "3:4" },
  { code: "S01", subject: "De behandelplek, leeg, met daglicht", where: "Over ons", ratio: "3:4" },
  { code: "E02", subject: "Haar in een staart, bevestigingen niet zichtbaar", where: "Extensions, invisible techniek", ratio: "4:5" },
  { code: "J03", subject: "Jessie in gesprek met een klant (klant onherkenbaar)", where: "Extensions, gratis consult", ratio: "4:5" },
  { code: "M05", subject: "Borstel, satijnen kussensloop of bonnet", where: "Extensions, verzorging thuis", ratio: "1:1" },
  { code: "N02", subject: "Gellak in een mooie kleur", where: "Nagels, bovenaan", ratio: "4:5" },
  { code: "N06", subject: "Mixed design of nail art met details", where: "Nagels, nail art", ratio: "4:5" },
  { code: "W05", subject: "Nail art in wording: penseel en details", where: "Nagels, nail art (klein)", ratio: "1:1" },
  { code: "W04", subject: "Product verwijderen of afweken", where: "Nagels, verwijderen", ratio: "4:5" },
  { code: "J04", subject: "Portret van dichtbij", where: "Over ons, bovenaan", ratio: "3:4" },
  { code: "J02", subject: "Jessie aan het werk, half van opzij", where: "Over ons", ratio: "4:5" },
  { code: "S02", subject: "Sfeerdetail van het interieur", where: "Over ons", ratio: "1:1" },
  { code: "S03", subject: "De entree van de salon", where: "Contact", ratio: "4:5" },
];

export const photoShotCodes = new Set(photoShots.map((shot) => shot.code));

/** Verhouding van een foto in het werk (afwisselend 3:4, 4:5 en 2:3) en van voor en na (4:5). */
export const workRatio: PhotoRatio = "3:4";
export const beforeAfterRatio: PhotoRatio = "4:5";

/**
 * Minimale breedte voor een scherpe foto: de grootste plek is op desktop
 * ±600 px breed, op een scherm met dubbele pixeldichtheid dus 1200 px.
 */
export const minPhotoWidth = 1200;

export function ratioParts(ratio: PhotoRatio): [number, number] {
  const [width, height] = ratio.split(":").map(Number) as [number, number];
  return [width, height];
}

/** Advies in woorden, bijv. "Staand 4:5, minimaal 1200 × 1500 px". */
export function formatAdvice(ratio: PhotoRatio): string {
  const [width, height] = ratioParts(ratio);
  const shape = width === height ? "Vierkant" : "Staand";
  return `${shape} ${ratio}, minimaal ${minPhotoWidth} × ${Math.round((minPhotoWidth * height) / width)} px`;
}
