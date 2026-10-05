import type { Metadata, Viewport } from "next";
import { site } from "@/config/site";
import { familjen } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${site.name} · Extensions en nagels in ${site.area}`,
    template: `%s · ${site.name}`,
  },
  // TODO(livegang): indexering pas aanzetten bij livegang (zie PROJECT-TODOS.md).
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#fffdfc",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="nl"
      className={familjen.variable}
      style={
        {
          "--nl-font-display": "var(--font-familjen)",
          "--nl-font-body": "var(--font-familjen)",
        } as React.CSSProperties
      }
    >
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
