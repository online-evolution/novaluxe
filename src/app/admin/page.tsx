import { Suspense } from "react";
import { requireAdmin } from "@/server/auth/session";

/*
 * Startpagina van het beheer. Het overzicht van vandaag en de aanvragen
 * volgt in Fase 11.
 */
export default function AdminHomePage() {
  return (
    <Suspense fallback={<p className="text-ink-soft">Even laden…</p>}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const admin = await requireAdmin();
  return (
    <div className="max-w-2xl">
      <h1 className="text-display-m font-medium">Welkom, {admin.name}</h1>
      <p className="mt-4 text-lede text-ink-soft">
        Hier zie je straks je afspraken van vandaag en nieuwe aanvragen die op je
        bevestiging wachten.
      </p>
    </div>
  );
}
