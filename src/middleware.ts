import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  // NextAuth v5 uses "authjs.session-token" as cookie name by default
  const token = await getToken({ req, secret, cookieName: "__Secure-authjs.session-token" })
    ?? await getToken({ req, secret, cookieName: "authjs.session-token" })
    ?? await getToken({ req, secret });

  const { pathname } = req.nextUrl;
  const isAuthPage = pathname.startsWith("/login");
  const isAuthApi = pathname.startsWith("/api/auth");
  const isWebhook = pathname.startsWith("/api/webhook");
  const isHealth = pathname.startsWith("/api/health");
  
  // Public marketing pages (no auth required)
  const isPublicPage = pathname === "/" ||
                       pathname === "/privacy" ||
                       pathname === "/terms";

  // Redirect logged-in users from landing page to dashboard
  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (isAuthApi || isWebhook || isHealth || isPublicPage) {
    return NextResponse.next();
  }

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
