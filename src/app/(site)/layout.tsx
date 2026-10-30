import { SiteHeader } from "@/components/site/site-header";
import { SiteShell } from "@/components/site/site-shell";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <SiteShell header={<SiteHeader />}>{children}</SiteShell>;
}
