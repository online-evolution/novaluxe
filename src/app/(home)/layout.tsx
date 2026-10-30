import { SiteShell } from "@/components/site/site-shell";

export default function HomeLayout({ children }: LayoutProps<"/">) {
  return <SiteShell>{children}</SiteShell>;
}
