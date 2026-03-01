import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/clear-cookies
 *
 * Clears the backend-set httpOnly auth cookies from the frontend domain.
 * This is necessary because the backend logout endpoint clears cookies
 * with path "/api", but the initial login sets them with path "/".
 * Both paths must be cleared for the middleware to detect the logout.
 */
export async function POST() {
  try {
    const cookieStore = await cookies();

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 0,
    };

    // Clear cookies at path "/" (set during login/register)
    cookieStore.set("accessToken", "", { ...cookieOptions, path: "/" });
    cookieStore.set("refreshToken", "", { ...cookieOptions, path: "/" });

    // Clear cookies at path "/api" (set during token renewal)
    cookieStore.set("accessToken", "", { ...cookieOptions, path: "/api" });
    cookieStore.set("refreshToken", "", { ...cookieOptions, path: "/api" });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to clear cookies" },
      { status: 500 },
    );
  }
}
