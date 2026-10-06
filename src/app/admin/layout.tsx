import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentAdmin } from "@/server/auth/session";
import { logout } from "./actions";

export const metadata: Metadata = {
  title: { default: "Beheer", template: "%s · Beheer NovaLuxe" },
  robots: { index: false, follow: false },
};

/*
 * Beheeromgeving voor Jessie: rustig, groot en zonder technische termen.
 * De sessie wordt per pagina gecontroleerd (requireAdmin); deze layout toont
 * alleen het menu als iemand is ingelogd.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <header className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-b border-line px-gutter py-4">
        <p className="text-small">
          <span className="text-[1.25rem] font-medium tracking-[-0.03em]">NovaLuxe</span>
          <span className="ml-3 text-ink-soft">Beheer</span>
        </p>
        <Suspense fallback={null}>
          <AdminNav />
        </Suspense>
      </header>
      <main id="inhoud" className="flex-1 px-gutter py-10 md:py-14">
        {children}
      </main>
    </div>
  );
}

const menu = [
  { href: "/admin", label: "Vandaag" },
  { href: "/admin/behandelingen", label: "Behandelingen" },
  { href: "/admin/openingstijden", label: "Openingstijden" },
  { href: "/admin/instellingen", label: "Instellingen" },
  { href: "/admin/account", label: "Account" },
] as const;

async function AdminNav() {
  const admin = await getCurrentAdmin();
  if (!admin) return null;

  return (
    <nav aria-label="Beheermenu" className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-small">
      {menu.map((item) => (
        <Link key={item.href} href={item.href} className="font-medium hover:text-bronze-deep">
          {item.label}
        </Link>
      ))}
      <form action={logout}>
        <button type="submit" className="text-ink-soft underline underline-offset-4 hover:text-ink">
          Uitloggen
        </button>
      </form>
    </nav>
  );
}
