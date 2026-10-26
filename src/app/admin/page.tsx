import Link from "next/link";
import { Suspense } from "react";
import { AdminSection, Loading } from "@/components/admin/admin-page";
import { AppointmentList } from "@/components/admin/appointment-list";
import { actionClass } from "@/components/ui/action";
import { effectiveStatus } from "@/domain/appointment";
import { addDays, formatLongDate, localDateString } from "@/lib/time";
import { listForDay, listRequests } from "@/server/admin/appointments";
import { requireAdmin } from "@/server/auth/session";

/*
 * Startpagina van het beheer: wat er vandaag gebeurt, welke aanvragen op
 * Jessie wachten, en morgen alvast.
 */
export default function AdminHomePage() {
  return (
    <Suspense fallback={<Loading />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  await requireAdmin();
  const now = new Date();
  const today = localDateString(now);
  const tomorrow = addDays(today, 1);
  const [todayItems, tomorrowItems, requests] = await Promise.all([
    listForDay(today),
    listForDay(tomorrow),
    listRequests(),
  ]);
  const open = requests.filter((item) => effectiveStatus(item, now) === "pending");

  return (
    <>
      <header className="flex max-w-3xl flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-display-m font-medium">Vandaag</h1>
          <p className="mt-3 text-lede text-ink-soft first-letter:uppercase">{formatLongDate(today)}</p>
        </div>
        <Link href="/admin/afspraken/nieuw" className={actionClass("quiet")}>
          Afspraak toevoegen
        </Link>
      </header>

      {open.length > 0 && (
        <AdminSection
          title={open.length === 1 ? "1 aanvraag wacht op jou" : `${open.length} aanvragen wachten op jou`}
          intro="Bevestig of wijs af. Doe je niets, dan komt de tijd na de bedenktijd weer vrij voor anderen."
        >
          <AppointmentList items={open} now={now} empty="" showDate showExpiry />
        </AdminSection>
      )}

      <AdminSection title="Agenda van vandaag">
        <AppointmentList items={todayItems} now={now} empty="Vandaag staan er geen afspraken." />
      </AdminSection>

      <AdminSection title={`Morgen, ${formatLongDate(tomorrow)}`}>
        <AppointmentList items={tomorrowItems} now={now} empty="Morgen staan er nog geen afspraken." />
      </AdminSection>

      <p className="mt-14 text-small">
        <Link href="/admin/afspraken?weergave=komend" className="underline underline-offset-4 hover:text-bronze-deep">
          Alle komende afspraken
        </Link>
      </p>
    </>
  );
}
