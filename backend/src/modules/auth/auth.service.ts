import type { CookieOptions, Request, Response } from "express";
import {
  NODE_ENV,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_SAMESITE,
  SESSION_COOKIE_SECURE,
} from "../../Constants.ts";
import {
  createSession,
  sessionTtlSec,
  type SessionUserPayload,
} from "../../lib/sessionStore.ts";

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
