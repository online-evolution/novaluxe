import "server-only";

/**
 * Het openbare adres van de site, voor links in mails. Mails kunnen buiten
 * een verzoek om vertrekken (op de achtergrond, of bij een nieuwe poging), dus
 * niet uit de headers maar uit de omgeving: SITE_URL, anders het
 * productieadres dat Vercel zelf meegeeft, anders lokaal.
 */
export function publicBaseUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
