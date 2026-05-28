import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_ONLY_ROUTES = ["/login", "/signup"];
const PROTECTED_ROUTE_PREFIXES = ["/dashboard"];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const sessionId = request.cookies.get("sessionId")?.value;

  const isPublicOnlyRoute = PUBLIC_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some((route) =>
    pathname.startsWith(route),
  );

  if (sessionId && isPublicOnlyRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!sessionId && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
