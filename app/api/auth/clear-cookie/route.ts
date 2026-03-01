import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to clear auth cookie" },
      { status: 500 },
    );
  }
}
