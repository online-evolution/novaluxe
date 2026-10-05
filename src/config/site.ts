/*
 * Vaste bedrijfsgegevens uit de aangeleverde websiteteksten.
 *
 * Alleen gegevens die zelden veranderen staan hier. Prijzen, behandeltijden,
 * openingstijden en boekingsregels komen uit de database, zodat Jessie ze
 * zelf kan aanpassen.
 */
export const site = {
  name: "NovaLuxe",
  owner: "Jessie",
  area: "Kijkduin",
  address: {
    street: "Wijndaelerduin 25",
    postalCode: "2554 BX",
    city: "Den Haag",
  },
  phone: {
    display: "06 13867266",
    href: "tel:+31613867266",
  },
  instagram: {
    handle: "@bynovaluxe",
    href: "https://www.instagram.com/bynovaluxe/",
  },
  kvk: "93396007",
  timeZone: "Europe/Amsterdam",
  locale: "nl-NL",
} as const;
