import { type NextRequest, NextResponse } from "next/server";

/**
 * Routes that only unauthenticated users should access.
 * Authenticated admins visiting these will be sent to the dashboard.
 */
const PUBLIC_ONLY_ROUTES = ["/login", "/signup"];

/**
 * Routes that require authentication.
 * Unauthenticated users hitting these will be redirected to /login.
 */
const PROTECTED_ROUTE_PREFIXES = ["/dashboard"];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const token = request.cookies.get("auth_token")?.value;

  const isPublicOnlyRoute = PUBLIC_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some((route) =>
    pathname.startsWith(route),
  );

  // Logged-in admins should not be able to visit login/signup
  if (token && isPublicOnlyRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Unauthenticated users cannot access protected routes
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
