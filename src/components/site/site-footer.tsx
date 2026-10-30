import Link from "next/link";
import { cacheLife } from "next/cache";
import { LogoFull } from "@/components/brand/logo";
import { BigLink } from "@/components/ui/action";
import { bookingHref, mainNavigation } from "@/config/navigation";
import { site } from "@/config/site";
import { summariseWeeklyHours } from "@/domain/hours";
import { getWeeklyHours } from "@/server/schedule";

function Icon({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-5 shrink-0 ${className}`}
    >
      {children}
    </svg>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="grid size-11 place-items-center rounded-full border border-sand/40 text-ivory transition-colors duration-(--duration-quick) hover:border-gold hover:text-gold"
    >
      <Icon>{children}</Icon>
    </a>
  );
}

/** Donkere afsluiter van elke pagina: merk, pagina's en contact in kolommen. */
export async function SiteFooter() {
  const [hours, year] = await Promise.all([getWeeklyHours(), getCurrentYear()]);

  return (
    <footer className="bg-ink px-gutter pt-section-tight pb-8 text-sand [&_:focus-visible]:outline-gold">
      <div className="mx-auto max-w-[76rem]">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6">
            <LogoFull className="w-44 lg:w-52" sizes="208px" />
            <p className="mt-6 max-w-[28rem]">
              Bij {site.name} in {site.area} neem ik de tijd om te luisteren naar wat jij mooi vindt.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <BigLink href={bookingHref} size="md">
                Afspraak maken
              </BigLink>
              <SocialLink href={site.instagram.href} label={`${site.name} op Instagram (${site.instagram.handle})`}>
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <path d="M17.5 6.5h.01" />
              </SocialLink>
              <SocialLink href={site.facebook.href} label={`${site.name} op Facebook`}>
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </SocialLink>
            </div>
          </div>

          <nav aria-labelledby="footer-paginas" className="lg:col-span-2">
            <h2 id="footer-paginas" className="label text-gold">
              Pagina’s
            </h2>
            <ul className="mt-5 grid gap-3">
              {mainNavigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-ivory transition-colors duration-(--duration-quick) hover:text-gold">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-4">
            <h2 className="label text-gold">Contact</h2>
            <ul className="mt-5 grid gap-4">
              <li className="flex gap-3">
                <Icon className="mt-1 text-gold">
                  <path d="M20 10c0 5-8 12-8 12s-8-7-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </Icon>
                <address className="text-ivory not-italic">
                  {site.address.street}
                  <br />
                  {site.address.postalCode} {site.address.city}
                </address>
              </li>
              <li className="flex gap-3">
                <Icon className="mt-1 text-gold">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                </Icon>
                <a href={site.phone.href} className="figures text-ivory transition-colors duration-(--duration-quick) hover:text-gold">
                  {site.phone.display}
                </a>
              </li>
              <li className="flex gap-3">
                <Icon className="mt-1 text-gold">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </Icon>
                <div>
                  <h3 className="sr-only">Openingstijden</h3>
                  <dl className="figures grid grid-cols-[auto_1fr] gap-x-6 text-ivory">
                    {summariseWeeklyHours(hours).map((line) => (
                      <div key={line.days} className="contents">
                        <dt>{line.days}</dt>
                        <dd>{line.hours}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </li>
              <li className="flex gap-3">
                <Icon className="mt-1 text-gold">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                </Icon>
                <p className="figures text-ivory">KvK {site.kvk}</p>
              </li>
            </ul>
          </div>
        </div>

        {/* TODO(content): links naar privacyverklaring en algemene voorwaarden zodra die er zijn. */}
        <div className="figures mt-section-tight flex flex-col gap-2 border-t border-sand/20 pt-6 text-small lg:flex-row lg:gap-8">
          <p>
            © {year} {site.name}. Alle rechten voorbehouden.
          </p>
          <p>
            Website door{" "}
            <a
              href={site.maker.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 transition-colors duration-(--duration-quick) hover:text-gold"
            >
              {site.maker.name}
            </a>
          </p>
        </div>
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
