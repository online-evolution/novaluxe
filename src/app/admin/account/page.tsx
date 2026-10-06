import type { Metadata } from "next";
import { Suspense } from "react";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <Suspense fallback={<p className="text-ink-soft">Even laden…</p>}>
      <Account />
    </Suspense>
  );
}

async function Account() {
  const admin = await requireAdmin();
  return (
    <div className="max-w-md">
      <h1 className="text-display-m font-medium">Account</h1>
      <p className="mt-4 text-ink-soft">
        Je bent ingelogd als <span className="text-ink">{admin.email}</span>.
      </p>
      <h2 className="mt-12 text-lede font-medium">Wachtwoord wijzigen</h2>
      <div className="mt-6">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
