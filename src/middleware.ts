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
  
  // Debug logging
  console.log('[Middleware]', { pathname, hasToken: !!token });
  const isAuthPage = pathname.startsWith("/login");
  const isAuthApi = pathname.startsWith("/api/auth");
  const isWebhook = pathname.startsWith("/api/webhook");
  const isHealth = pathname.startsWith("/api/health");
  
  // Public marketing pages (no auth required)
  const isPublicPage = pathname === "/" ||
                       pathname === "/privacy" ||
                       pathname === "/terms";

  // Always allow auth API, webhooks, and health checks
  if (isAuthApi || isWebhook || isHealth) {
    return NextResponse.next();
  }

  // Redirect logged-in users from landing page to dashboard
  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  // Allow public pages for non-logged-in users
  if (!token && isPublicPage) {
    console.log('[Middleware] Allowing public page access');
    return NextResponse.next();
  }

  // Redirect non-logged-in users to login (except for public pages and auth page)
  if (!token && !isAuthPage) {
    console.log('[Middleware] Redirecting to login');
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  // Redirect logged-in users away from login page
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
