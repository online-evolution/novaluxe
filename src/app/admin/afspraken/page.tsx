import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminPageHeader, Loading } from "@/components/admin/admin-page";
import { AppointmentList } from "@/components/admin/appointment-list";
import { actionClass } from "@/components/ui/action";
import { listPast, listRequests, listUpcoming, listUpcomingBusy } from "@/server/admin/appointments";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Afspraken" };

const views = {
  aanvragen: {
    label: "Aanvragen",
    empty: "Er wachten geen aanvragen op je.",
    load: listRequests,
  },
  komend: {
    label: "Komend",
    empty: "Er staan geen afspraken gepland.",
    load: listUpcoming,
  },
  eerder: {
    label: "Eerder",
    empty: "Nog geen eerdere afspraken.",
    load: () => listPast(),
  },
} as const;

type View = keyof typeof views;

export default function AppointmentsPage({ searchParams }: PageProps<"/admin/afspraken">) {
  return (
    <>
      <div className="flex max-w-3xl flex-wrap items-end justify-between gap-6">
        <AdminPageHeader
          title="Afspraken"
          intro="Nieuwe aanvragen, je komende afspraken en wat er eerder was. Tik op een afspraak voor de details."
        />
        <Link href="/admin/afspraken/nieuw" className={actionClass("primary")}>
          Afspraak toevoegen
        </Link>
      </div>
      <Suspense fallback={<Loading />}>
        <AppointmentsView searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function AppointmentsView({ searchParams }: Pick<PageProps<"/admin/afspraken">, "searchParams">) {
  await requireAdmin();
  const requested = (await searchParams).weergave;
  const view: View = requested === "komend" || requested === "eerder" ? requested : "aanvragen";
  const [items, busy] = await Promise.all([
    views[view].load(),
    view === "komend" ? listUpcomingBusy() : Promise.resolve([]),
  ]);
  const now = new Date();

  return (
    <>
      <nav aria-label="Weergave" className="mt-10 inline-flex max-w-full gap-1 rounded-full bg-ivory p-1.5">
        {(Object.keys(views) as View[]).map((key) => (
          <Link
            key={key}
            href={(key === "aanvragen" ? "/admin/afspraken" : `/admin/afspraken?weergave=${key}`) as Route}
            aria-current={key === view ? "page" : undefined}
            className="rounded-full px-5 py-2.5 font-medium text-ink-soft transition-colors duration-(--duration-quick) hover:text-ink aria-[current=page]:bg-cream aria-[current=page]:text-ink aria-[current=page]:shadow-[0_6px_16px_-10px_rgb(51_44_37/0.5)]"
          >
            {views[key].label}
          </Link>
        ))}
      </nav>
      <div className="mt-10 max-w-3xl">
        <AppointmentList
          items={items}
          busy={busy}
          now={now}
          empty={views[view].empty}
          showDate
          showExpiry={view === "aanvragen"}
        />
      </div>
    </>
  );
}
