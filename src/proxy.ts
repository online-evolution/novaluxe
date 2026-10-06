import { NextResponse, type NextRequest } from "next/server";

/*
 * Snelle, optimistische doorverwijzing: zonder sessiecookie hoef je de
 * beheerpagina's niet eens te laden. Dit is géén beveiliging op zich: elke
 * adminpagina en serveractie controleert de sessie zelf in de database
 * (src/server/auth/session.ts).
 */
const sessionCookies = ["__Host-nl_admin", "nl_admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/inloggen") return NextResponse.next();

  const hasSession = sessionCookies.some((name) => request.cookies.has(name));
  if (!hasSession) {
    return NextResponse.redirect(new URL("/admin/inloggen", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
