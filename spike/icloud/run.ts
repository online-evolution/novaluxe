/*
 * iCloud-spike (Fase 14) vanaf de opdrachtregel. Dezelfde controles staan ook
 * in het beheer onder iCloud testen; die pagina is de makkelijkste weg.
 *
 *   npm run spike:icloud                      lezen + schrijven in de agenda "NovaLuxe spike"
 *   npm run spike:icloud -- --alleen-lezen    alleen bezette tijden lezen
 *   npm run spike:icloud -- --rapport <bestand>
 *
 * Inloggegevens alleen in .env.icloud-spike (valt onder .env* in .gitignore):
 *   ICLOUD_SPIKE_USERNAME=<Apple ID, niet dat van Jessie>
 *   ICLOUD_SPIKE_APP_PASSWORD=<app-specifiek wachtwoord>
 */
import { writeFileSync } from "node:fs";
import { runIcloudSpike } from "./checks";

const args = process.argv.slice(2);
const readOnly = args.includes("--alleen-lezen");
const reportPath = args.includes("--rapport") ? args[args.indexOf("--rapport") + 1] : undefined;

try {
  process.loadEnvFile(".env.icloud-spike");
} catch {
  // Geen bestand: dan uit de omgeving.
}

const username = process.env.ICLOUD_SPIKE_USERNAME ?? "";
const password = process.env.ICLOUD_SPIKE_APP_PASSWORD ?? "";
if (!username || !password) {
  console.error("Zet ICLOUD_SPIKE_USERNAME en ICLOUD_SPIKE_APP_PASSWORD in .env.icloud-spike.");
  process.exit(1);
}

async function main() {
  const report = await runIcloudSpike({ username, password, readOnly });
  const lines = [
    `# iCloud-spike, ${new Date().toISOString()}`,
    "",
    `Oordeel: ${report.ok ? "geslaagd" : "niet geslaagd"}`,
    "",
    ...report.steps.map((step) => {
      const mark = step.ok === null ? "i" : step.ok ? "✓" : "✗";
      return `- ${mark} ${step.label} (${step.ms} ms)${step.detail ? `: ${step.detail}` : ""}`;
    }),
  ];
  console.log(lines.join("\n"));
  if (reportPath) {
    writeFileSync(reportPath, `${lines.join("\n")}\n`);
    console.log(`\nRapport weggeschreven naar ${reportPath}`);
  }
  process.exitCode = report.ok ? 0 : 1;
}

void main();
