import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminPageHeader, AdminSection, Loading } from "@/components/admin/admin-page";
import { listTreatmentsForAdmin } from "@/server/admin/catalog";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Behandelingen" };

const categories = [
  { key: "nails", title: "Nagels" },
  { key: "extensions", title: "Extensions" },
] as const;

export default function TreatmentsPage() {
  return (
    <>
      <AdminPageHeader
        title="Behandelingen"
        intro="Pas prijzen en behandeltijden aan, of zet een behandeling tijdelijk uit. Wijzigingen staan direct op de website."
      />
      <Suspense fallback={<Loading />}>
        <TreatmentList />
      </Suspense>
    </>
  );
}

async function TreatmentList() {
  await requireAdmin();
  const treatments = await listTreatmentsForAdmin();

  return (
    <>
      {categories.map((category) => (
        <AdminSection key={category.key} title={category.title}>
          <ul className="border-t border-line-strong">
            {treatments
              .filter((treatment) => treatment.category === category.key)
              .map((treatment) => (
                <li key={treatment.id} className="border-b border-line">
                  <Link
                    href={`/admin/behandelingen/${treatment.slug}`}
                    className="flex items-baseline justify-between gap-6 py-4 hover:text-bronze-deep"
                  >
                    <span className="font-medium">{treatment.name}</span>
                    <span className="text-right text-small text-ink-soft">
                      {!treatment.active && <span className="text-alert">Uit · </span>}
                      {treatment.incompleteCount > 0
                        ? `${treatment.incompleteCount} nog niet online te boeken`
                        : `${treatment.variantCount} ${treatment.variantCount === 1 ? "variant" : "varianten"}`}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </AdminSection>
      ))}

      <AdminSection title="Extra opties" intro="Nail art en verwijderen vóór een nieuwe set.">
        <Link href="/admin/behandelingen/opties" className="font-medium underline underline-offset-4">
          Extra opties aanpassen
        </Link>
      </AdminSection>
    </>
  );
}
