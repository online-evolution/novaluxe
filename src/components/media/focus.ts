export type PhotoFocus = "top" | "center" | "bottom";

/** CSS object-position per gekozen uitsnede (het deel dat zichtbaar moet blijven). */
export const focusPosition: Record<PhotoFocus, string> = {
  top: "50% 15%",
  center: "50% 50%",
  bottom: "50% 85%",
};
