import Link from "next/link";
import { cacheLife } from "next/cache";
import { bookingHref, mainNavigation } from "@/config/navigation";
import { site } from "@/config/site";
import { summariseWeeklyHours } from "@/domain/hours";
import { getWeeklyHours } from "@/server/schedule";

/**
 * Colofon: adres en contact staan groot (ook als ruime tikdoelen op mobiel),
 * de rest klein eronder. Geen kolommenraster.
 */
export async function SiteFooter() {
  const [hours, year] = await Promise.all([getWeeklyHours(), getCurrentYear()]);

  return (
    <footer className="mt-section bg-ivory px-gutter pt-section-tight pb-10">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-6">
          <h2 className="label text-ink-soft">Je vindt de salon in {site.area}</h2>
          <address className="mt-4 text-display-s font-medium not-italic">
            {site.address.street}
            <br />
            {site.address.postalCode} {site.address.city}
          </address>

          <h2 className="label mt-10 text-ink-soft">Openingstijden</h2>
          <dl className="figures mt-3 grid max-w-xs grid-cols-[auto_1fr] gap-x-8 gap-y-1 text-small">
            {summariseWeeklyHours(hours).map((line) => (
              <div key={line.days} className="contents">
                <dt>{line.days}</dt>
                <dd className="text-ink-soft">{line.hours}</dd>
              </div>
            ))}
          </dl>
        </div>

        <ul className="flex flex-col gap-6 lg:col-span-5 lg:col-start-8">
          <li>
            <p className="label text-ink-soft">Bel NovaLuxe</p>
            <a
              href={site.phone.href}
              className="figures mt-1 inline-block text-display-s font-medium decoration-bronze underline-offset-8 hover:underline"
            >
              {site.phone.display}
            </a>
          </li>
          <li>
            <p className="label text-ink-soft">Bekijk Instagram</p>
            <a
              href={site.instagram.href}
              className="mt-1 inline-block text-display-s font-medium decoration-bronze underline-offset-8 hover:underline"
            >
              {site.instagram.handle}
            </a>
          </li>
        </ul>
      </div>

      <div className="mt-section-tight flex flex-col gap-6 border-t border-line-strong pt-6 lg:flex-row lg:items-baseline lg:justify-between">
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-small">
            {mainNavigation.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-ink-soft hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={bookingHref} className="font-medium text-ink hover:text-bronze-deep">
                Afspraak maken
              </Link>
            </li>
          </ul>
        </nav>
        {/* TODO(content): links naar privacyverklaring en algemene voorwaarden zodra die er zijn. */}
        <p className="figures text-small text-ink-soft">
          KvK {site.kvk} · © {year} {site.name}
        </p>
      </div>
    </footer>
  );
}

/** Het jaartal verandert zelden; gecachet zodat de footer statisch kan blijven. */
async function getCurrentYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
