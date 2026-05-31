import type { CookieOptions, Request, Response } from "express";
import {
  NODE_ENV,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_SAMESITE,
  SESSION_COOKIE_SECURE,
} from "../../Constants.ts";
import { uniStudents } from "../../db/models/auth.models.ts";
import {
  createSession,
  sessionTtlSec,
  type SessionUserPayload,
} from "../../lib/sessionStore.ts";
import { sendMail } from "../../utils/email.ts";
import ApiError from "../../utils/ApiError.ts";

type StudentRow = typeof uniStudents.$inferSelect;

export const sessionCookieMaxAgeMs = sessionTtlSec * 1000;

function getCookieSameSite(): CookieOptions["sameSite"] {
  const raw = SESSION_COOKIE_SAMESITE?.trim().toLowerCase();
  if (raw === "lax" || raw === "strict" || raw === "none") {
    return raw;
  }
  return "lax";
}

function getCookieSecure(sameSite: CookieOptions["sameSite"]): boolean {
  // SameSite=None requires Secure in modern browsers.
  if (sameSite === "none") {
    return true;
  }

  const raw = SESSION_COOKIE_SECURE?.trim().toLowerCase();
  if (raw === "true") {
    return true;
  }
  if (raw === "false") {
    return false;
  }

  return NODE_ENV === "production";
}

const cookieSameSite = getCookieSameSite();

/**
 * Shared cookie attributes. `httpOnly` keeps JS from reading them; `sameSite`
 * defaults to "lax" so top-level returns from payment gateways (SSLCommerz)
 * continue carrying the session cookie. `secure` is production-only so local
 * development over HTTP keeps working.
 */
export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: getCookieSecure(cookieSameSite),
  sameSite: cookieSameSite,
};

export const setSessionCookie = (
  res: Response,
  sessionId: string,
  cookiePath: string = "/"
): Response => {
  return res.cookie(SESSION_COOKIE_NAME, sessionId, {
    ...cookieOptions,
    maxAge: sessionCookieMaxAgeMs,
    path: cookiePath,
  });
};

/**
 * Clear the session cookie. Always pair this with session revocation so the
 * browser does not keep replaying a dead session id.
 */
export const clearSessionCookie = (
  res: Response,
  cookiePath: string = "/"
): Response => {
  const opts = { ...cookieOptions, path: cookiePath };
  return res.clearCookie(SESSION_COOKIE_NAME, opts);
};

/**
 * Create a Redis-backed live session and set the httpOnly session cookie.
 */
export function toStudentLoginData(student: StudentRow) {
  return {
    id: student.id,
    email: student.email,
    name: student.name,
    phone: student.phone,
    avatarUrl: student.avatarUrl,
    academicDepartment: student.academicDepartment,
    rollNumber: student.rollNumber,
    session: student.session,
    hall: student.hall,
    roomId: student.roomId,
    status: student.status,
    isAllocated: student.isAllocated,
  };
}

export async function sendStudentVerificationOtpEmail(
  to: string,
  name: string,
  otp: string,
  expiresMinutes: number
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1a365d;">Verify your email</h2>
      <p>Hello ${name},</p>
      <p>Use the code below to complete your RUET Hall Management registration:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #2b6cb0;">${otp}</p>
      <p style="color: #666;">This code expires in ${expiresMinutes} minutes.</p>
      <p style="color: #999; font-size: 12px;">If you did not sign up, you can ignore this email.</p>
    </div>
  `;

  const sent = await sendMail({
    to,
    subject: "RUET Hall — Email verification code",
    html,
  });

  if (!sent) {
    throw new ApiError(503, "Failed to send verification email. Try again later.");
  }
}

export const createSessionAndSetCookie = async ({
  req,
  res,
  cookiePath = "/",
  payload,
}: {
  req: Request;
  res: Response;
  payload: SessionUserPayload;
  cookiePath?: string;
}): Promise<{ sessionId: string }> => {
  const live = await createSession(req, payload);
  setSessionCookie(res, live.sessionId, cookiePath);
  return { sessionId: live.sessionId };
};
