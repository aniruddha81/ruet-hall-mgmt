import { NextResponse } from "next/server";

/**
 * POST /api/auth/clear-cookies
 *
 * Clears the backend-set httpOnly auth cookies from the frontend domain.
 * Uses explicit Set-Cookie headers with `expires` in the past to ensure
 * the browser reliably removes the cookies at every path they may exist.
 */
export async function POST() {
  const expired = "Thu, 01 Jan 1970 00:00:00 GMT";
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const base = `; HttpOnly; SameSite=Strict${secure}; Expires=${expired}`;

  const headers = new Headers();

  // Clear at path "/" (set during login/register)
  headers.append("Set-Cookie", `accessToken=; Path=/${base}`);
  headers.append("Set-Cookie", `refreshToken=; Path=/${base}`);

  return NextResponse.json({ success: true }, { headers });
}
