import Link from "next/link";
import type { Route } from "next";

type ActionVariant = "primary" | "quiet";

const base =
  "group inline-flex items-baseline gap-3 label transition-colors duration-(--duration-quick) ease-soft";

const variants: Record<ActionVariant, string> = {
  // Eén volle knop per scherm: de afspraak.
  primary:
    "bg-ink px-6 py-4 text-cream hover:bg-bronze-deep focus-visible:bg-bronze-deep",
  // Tekstactie met een lijn die bij hover doortrekt.
  quiet:
    "border-b border-line-strong pb-1.5 text-ink hover:border-ink focus-visible:border-ink",
};

export function actionClass(variant: ActionVariant = "primary"): string {
  return `${base} ${variants[variant]}`;
}

type ActionLinkProps<T extends string> = {
  href: Route<T>;
  variant?: ActionVariant;
  children: React.ReactNode;
};

export function ActionLink<T extends string>({
  href,
  variant = "primary",
  children,
}: ActionLinkProps<T>) {
  return (
    <Link href={href} className={actionClass(variant)}>
      {children}
    </Link>
  );
}

type BigLinkProps<T extends string> = {
  href: Route<T>;
  /** Licht op een donker vlak. */
  tone?: "ink" | "cream";
  children: React.ReactNode;
};

/** De grote knop van de openbare pagina's. */
export function BigLink<T extends string>({ href, tone = "ink", children }: BigLinkProps<T>) {
  return (
    <Link
      href={href}
      className={`inline-block px-9 py-4 text-lede font-semibold transition-colors duration-(--duration-quick) ${
        tone === "ink"
          ? "bg-ink text-cream hover:bg-bronze-deep focus-visible:bg-bronze-deep"
          : "bg-cream text-ink hover:bg-ivory focus-visible:bg-ivory"
      }`}
    >
      {children}
    </Link>
  );
}
