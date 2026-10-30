import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminPageHeader, Loading } from "@/components/admin/admin-page";
import { AppointmentList } from "@/components/admin/appointment-list";
import { actionClass } from "@/components/ui/action";
import { listPast, listRequests, listUpcoming } from "@/server/admin/appointments";
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
    empty: "Er staan geen bevestigde afspraken gepland.",
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
  const items = await views[view].load();
  const now = new Date();

  return (
    <>
      <nav aria-label="Weergave" className="mt-10 flex max-w-3xl gap-x-8 border-b border-line-strong">
        {(Object.keys(views) as View[]).map((key) => (
          <Link
            key={key}
            href={(key === "aanvragen" ? "/admin/afspraken" : `/admin/afspraken?weergave=${key}`) as Route}
            aria-current={key === view ? "page" : undefined}
            className="-mb-px border-b-2 border-transparent pb-3 text-small font-medium text-ink-soft hover:text-ink aria-[current=page]:border-ink aria-[current=page]:text-ink"
          >
            {views[key].label}
          </Link>
        ))}
      </nav>
      <div className="mt-8 max-w-3xl">
        <AppointmentList
          items={items}
          now={now}
          empty={views[view].empty}
          showDate
          showExpiry={view === "aanvragen"}
        />
      </div>
    </>
  );
}
