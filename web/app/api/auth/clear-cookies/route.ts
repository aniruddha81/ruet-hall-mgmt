import { NextResponse } from "next/server";

/**
 * POST /api/auth/clear-cookies
 *
 * Clears the backend-set httpOnly session cookie from the frontend domain.
 */
export async function POST() {
  const expired = "Thu, 01 Jan 1970 00:00:00 GMT";
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const base = `; HttpOnly; SameSite=Strict${secure}; Expires=${expired}`;

  const headers = new Headers();
  headers.append("Set-Cookie", `sessionId=; Path=/${base}`);

  return NextResponse.json({ success: true }, { headers });
}
