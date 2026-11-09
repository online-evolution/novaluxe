import Link from "next/link";
import { cacheLife } from "next/cache";
import { LogoFull } from "@/components/brand/logo";
import { BigLink } from "@/components/ui/action";
import { Icon, type IconName } from "@/components/ui/icons";
import { bookingHref, mainNavigation } from "@/config/navigation";
import { site } from "@/config/site";
import { summariseWeeklyHours } from "@/domain/hours";
import { getWeeklyHours } from "@/server/schedule";

function SocialLink({ href, label, icon }: { href: string; label: string; icon: IconName }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label}, opent in een nieuw venster`}
      className="grid size-11 place-items-center rounded-full border border-sand/40 text-ivory transition-colors duration-(--duration-quick) hover:border-gold hover:text-gold"
    >
      <Icon name={icon} />
    </a>
  );
}

/** Donkere afsluiter van elke pagina: merk, pagina's, contact en openingstijden in kolommen. */
export async function SiteFooter() {
  const [hours, year] = await Promise.all([getWeeklyHours(), getCurrentYear()]);

  return (
    <footer className="bg-ink px-gutter pt-section-tight pb-8 text-sand [&_:focus-visible]:outline-gold">
      <div className="mx-auto max-w-[76rem]">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-4">
            <LogoFull className="w-44 lg:w-52" sizes="208px" />
            <p className="mt-6 max-w-[28rem]">
              Bij {site.name} in {site.area} neem ik de tijd om te luisteren naar wat jij mooi vindt.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <BigLink href={bookingHref} size="md">
                Afspraak maken
              </BigLink>
              <SocialLink
                href={site.instagram.href}
                label={`${site.name} op Instagram (${site.instagram.handle})`}
                icon="instagram"
              />
              <SocialLink href={site.facebook.href} label={`${site.name} op Facebook`} icon="facebook" />
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

          <div className="lg:col-span-3">
            <h2 className="label text-gold">Contact</h2>
            <ul className="mt-5 grid gap-4">
              <li className="flex gap-3">
                <Icon name="pin" className="mt-1 text-gold" />
                <address className="text-ivory not-italic">
                  {site.address.street}
                  <br />
                  {site.address.postalCode} {site.address.city}
                </address>
              </li>
              <li className="flex gap-3">
                <Icon name="phone" className="mt-1 text-gold" />
                <a href={site.phone.href} className="figures text-ivory transition-colors duration-(--duration-quick) hover:text-gold">
                  {site.phone.display}
                </a>
              </li>
              <li className="flex gap-3">
                <Icon name="mail" className="mt-1 text-gold" />
                <a
                  href={site.email.href}
                  className="min-w-0 text-ivory [overflow-wrap:anywhere] transition-colors duration-(--duration-quick) hover:text-gold"
                >
                  {site.email.display}
                </a>
              </li>
              <li className="flex gap-3">
                <Icon name="briefcase" className="mt-1 text-gold" />
                <p className="figures text-ivory">KvK {site.kvk}</p>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h2 className="label text-gold">Openingstijden</h2>
            <dl className="figures mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-ivory">
              {summariseWeeklyHours(hours).map((line) => (
                <div key={line.days} className="contents">
                  <dt>{line.days}</dt>
                  <dd>{line.hours}</dd>
                </div>
              ))}
            </dl>
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
