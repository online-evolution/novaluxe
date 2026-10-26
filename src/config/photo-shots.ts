/*
 * Vaste fotoplekken op de website, met de shotcodes uit PHOTO-SHOTLIST.md.
 * Eén foto per code; staat een code op meer pagina's, dan verschijnt daar
 * dezelfde foto. De foto's van het werk en voor en na staan hier niet: die
 * beheert Jessie als verzameling.
 */

export type PhotoShot = {
  code: string;
  subject: string;
  /** Waar de foto op de site staat, in woorden voor het beheer. */
  where: string;
};

export const photoShots: PhotoShot[] = [
  { code: "W01", subject: "Handen van Jessie aan het werk aan nagels", where: "Homepage, bovenaan" },
  { code: "J01", subject: "Portret van Jessie in de salon", where: "Homepage, over Jessie" },
  { code: "E01", subject: "Extensions van achteren, lang haar met een natuurlijke val", where: "Homepage (behandelingen) en Extensions, bovenaan" },
  { code: "N03", subject: "BIAB naturel of French op de eigen nagel", where: "Homepage, behandelingen" },
  { code: "S01", subject: "De behandelplek, leeg, met daglicht", where: "Homepage (alle aandacht) en Over ons" },
  { code: "E02", subject: "Haar in een staart, bevestigingen niet zichtbaar", where: "Extensions, invisible techniek" },
  { code: "J03", subject: "Jessie in gesprek met een klant (klant onherkenbaar)", where: "Extensions, gratis consult" },
  { code: "M05", subject: "Borstel, satijnen kussensloop of bonnet", where: "Extensions, verzorging thuis" },
  { code: "N02", subject: "Gellak in een mooie kleur", where: "Nagels, bovenaan" },
  { code: "N06", subject: "Mixed design of nail art met details", where: "Nagels, nail art" },
  { code: "W05", subject: "Nail art in wording: penseel en details", where: "Nagels, nail art (klein)" },
  { code: "W04", subject: "Product verwijderen of afweken", where: "Nagels, verwijderen" },
  { code: "J04", subject: "Portret van dichtbij", where: "Over ons, bovenaan" },
  { code: "J02", subject: "Jessie aan het werk, half van opzij", where: "Over ons" },
  { code: "S02", subject: "Sfeerdetail van het interieur", where: "Over ons" },
  { code: "S03", subject: "De entree van de salon", where: "Contact" },
];

export const photoShotCodes = new Set(photoShots.map((shot) => shot.code));
