export type TreatmentCategory = "nails" | "extensions";
export type VariantKind = "standard" | "new_set" | "refill";
export type OptionKind = "nail_art" | "removal_before_new_set";

export type CatalogVariant = {
  id: string;
  label: string;
  kind: VariantKind;
  lengthCm: number | null;
  weftRows: number | null;
  priceCents: number | null;
  durationMinutes: number | null;
  note: string | null;
  sortOrder: number;
};

export type CatalogOption = {
  id: string;
  kind: OptionKind;
  name: string;
  priceCents: number | null;
  priceConfirmed: boolean;
  durationMinutes: number | null;
  /** Leeg = bij alle varianten van de behandeling; anders alleen bij dit soort. */
  variantKind: VariantKind | null;
};

export type CatalogTreatment = {
  id: string;
  slug: string;
  category: TreatmentCategory;
  name: string;
  summary: string | null;
  publiclyBookable: boolean;
  sortOrder: number;
  variants: CatalogVariant[];
  options: CatalogOption[];
};

/** Een variant zonder prijs of duur is incompleet: we verzinnen geen waarden. */
export function isVariantComplete(variant: CatalogVariant): boolean {
  return variant.priceCents !== null && variant.durationMinutes !== null;
}

/** Zelf online aan te vragen in de openbare reserveringsflow. */
export function isPubliclyBookable(
  treatment: CatalogTreatment,
  variant: CatalogVariant,
): boolean {
  return treatment.publiclyBookable && isVariantComplete(variant);
}

export function optionsForVariant(
  treatment: CatalogTreatment,
  variant: CatalogVariant,
): CatalogOption[] {
  return treatment.options.filter(
    (option) => option.variantKind === null || option.variantKind === variant.kind,
  );
}
