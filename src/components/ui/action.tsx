import Link from "next/link";
import type { Route } from "next";
import type { ComponentProps } from "react";

type ActionVariant = "primary" | "quiet";

const base =
  "group inline-flex items-baseline gap-3 label transition-colors duration-(--duration-quick) ease-soft";

const variants: Record<Exclude<ActionVariant, "primary">, string> = {
  // Tekstactie met een lijn die bij hover doortrekt.
  quiet:
    "border-b border-line-strong pb-1.5 text-ink hover:border-ink focus-visible:border-ink",
};

export function actionClass(variant: ActionVariant = "primary"): string {
  // Volle knop: goudfolie, zie .gold-button in globals.css.
  return variant === "primary" ? "gold-button px-7 py-3.5" : `${base} ${variants[variant]}`;
}

const bigLinkSizes = {
  sm: "px-4 py-2.5 text-small",
  md: "px-6 py-3",
  lg: "px-5 py-3.5 text-lede sm:px-8",
};

type BigLinkProps<T extends string> = {
  href: Route<T>;
  size?: keyof typeof bigLinkSizes;
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
} & Pick<ComponentProps<"a">, "onClick">;

/** De gouden knop van de openbare pagina's. De pijl vliegt eruit bij hover. */
export function BigLink<T extends string>({
  href,
  size = "lg",
  arrow = true,
  className = "",
  onClick,
  children,
}: BigLinkProps<T>) {
  return (
    <Link href={href} onClick={onClick} className={`gold-button ${bigLinkSizes[size]} ${className}`}>
      {children}
      {arrow && <GoldArrow />}
    </Link>
  );
}

/** Dezelfde knop voor een link naar buiten de site (kaart, Instagram). */
export function BigAnchor({
  href,
  size = "lg",
  className = "",
  children,
  ...rest
}: {
  href: string;
  size?: keyof typeof bigLinkSizes;
  className?: string;
  children: React.ReactNode;
} & Pick<ComponentProps<"a">, "target" | "rel">) {
  return (
    <a href={href} className={`gold-button ${bigLinkSizes[size]} ${className}`} {...rest}>
      {children}
      <GoldArrow />
    </a>
  );
}

function GoldArrow() {
  return (
    <span aria-hidden="true" className="gold-arrow">
      <span>↗</span>
    </span>
  );
}
