import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPageHeader, Loading } from "@/components/admin/admin-page";
import { IcloudTestForm } from "@/components/admin/icloud-test-form";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "iCloud testen" };

/** De test praat een paar keer met iCloud; meer tijd dan een gewone pagina. */
export const maxDuration = 60;

/*
 * iCloud-spike (Fase 14) in het beheer: testen of de agenda-koppeling
 * betrouwbaar werkt, zonder iets op te slaan. De koppeling zelf (met een
 * versleuteld bewaard wachtwoord) komt pas na een geslaagde test.
 */
export default function IcloudTestPage() {
  return (
    <>
      <AdminPageHeader
        title="iCloud testen"
        intro="Hier test je of NovaLuxe goed met een iCloud-agenda kan werken. Er wordt niets opgeslagen en er verandert niets aan je afspraken."
      />
      <Suspense fallback={<Loading />}>
        <IcloudTest />
      </Suspense>
    </>
  );
}

async function IcloudTest() {
  await requireAdmin();

  return (
    <>
      <section aria-labelledby="icloud-stappen" className="mt-10 max-w-2xl">
        <h2 id="icloud-stappen" className="text-lede font-medium">
          Zo werkt het
        </h2>
        <ol className="mt-4 grid list-decimal gap-3 pl-5">
          <li>
            Gebruik een Apple ID dat níet van Jessie is, bijvoorbeeld je eigen. Jessies agenda komt pas aan de beurt als
            deze test is geslaagd.
          </li>
          <li>
            Maak een app-specifiek wachtwoord: ga naar{" "}
            <a
              href="https://account.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-bronze-deep"
            >
              account.apple.com <span className="sr-only">(opent in een nieuw venster)</span>
            </a>
            , log in, kies <strong className="font-medium">Inloggen en beveiliging</strong> en dan{" "}
            <strong className="font-medium">App-specifieke wachtwoorden</strong>. Noem het bijvoorbeeld “NovaLuxe”.
            Je krijgt een code als <span className="figures">abcd-efgh-ijkl-mnop</span>.
          </li>
          <li>Vul hieronder het Apple ID en die code in en klik op de knop.</li>
        </ol>
        <p className="mt-4 text-small text-ink-soft">
          De test maakt een agenda “NovaLuxe spike” met een paar testafspraken, controleert ze en verwijdert de
          afspraken weer. Uit je andere agenda’s leest hij alleen hoeveel tijd er bezet is, nooit wat er staat. Je kunt
          het wachtwoord daarna bij Apple weer intrekken.
        </p>
      </section>

      <div className="mt-10">
        <IcloudTestForm />
      </div>
    </>
  );
}
