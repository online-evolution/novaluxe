import Link from "next/link";
import type { Route } from "next";

/** Kop van een beheerpagina, met optioneel een terugweg. */
export function AdminPageHeader({
  title,
  intro,
  back,
}: {
  title: string;
  intro?: string;
  back?: { href: Route; label: string };
}) {
  return (
    <header className="max-w-2xl">
      {back && (
        <Link href={back.href} className="text-small text-ink-soft hover:text-ink">
          ← {back.label}
        </Link>
      )}
      <h1 className={`text-display-m font-medium ${back ? "mt-4" : ""}`}>{title}</h1>
      {intro && <p className="mt-4 text-ink-soft">{intro}</p>}
    </header>
  );
}

export function AdminSection({
  title,
  intro,
  id,
  children,
}: {
  title: string;
  intro?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-titel` : undefined} className="mt-14 max-w-3xl scroll-mt-6">
      <h2 id={id ? `${id}-titel` : undefined} className="text-lede font-medium">
        {title}
      </h2>
      {intro && <p className="mt-2 max-w-2xl text-small text-ink-soft">{intro}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function Loading() {
  return <p className="text-ink-soft">Even laden…</p>;
}
