import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { getCurrentAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Inloggen" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-display-s font-medium">Inloggen</h1>
      <p className="mt-3 text-ink-soft">Log in om je afspraken en instellingen te beheren.</p>
      <div className="mt-10">
        <Suspense fallback={null}>
          <RedirectWhenLoggedIn />
        </Suspense>
        <LoginForm />
      </div>
    </div>
  );
}

/** Al ingelogd? Dan direct door naar het overzicht. */
async function RedirectWhenLoggedIn() {
  if (await getCurrentAdmin()) redirect("/admin");
  return null;
}
