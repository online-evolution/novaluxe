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
  /** Wijndaelerduin 25 volgens OpenStreetMap (Nominatim, nov. 2026); voor de kaart op Contact. */
  geo: { lat: 52.0611039, lon: 4.2212403 },
  phone: {
    display: "06 13867266",
    href: "tel:+31613867266",
  },
  email: {
    display: "bynovaluxe.beauty@gmail.com",
    href: "mailto:bynovaluxe.beauty@gmail.com",
  },
  instagram: {
    handle: "@bynovaluxe",
    href: "https://www.instagram.com/bynovaluxe/",
  },
  facebook: {
    href: "https://www.facebook.com/profile.php?id=61564718295250",
  },
  kvk: "93396007",
  maker: {
    name: "The Online Evolution",
    href: "https://www.online-evolution.nl",
  },
  timeZone: "Europe/Amsterdam",
  locale: "nl-NL",
} as const;
