/**
 * Cache-tags voor gegevens die Jessie in de admin wijzigt. Een adminactie
 * roept `updateTag(tag)` aan; de publieke pagina's tonen daarna direct de
 * nieuwe waarden zonder deploy.
 */
export const cacheTags = {
  catalog: "catalog",
  businessHours: "business-hours",
  settings: "settings",
} as const;
