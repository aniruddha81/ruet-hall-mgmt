import type { CookieOptions, Request, Response } from "express";
import { NODE_ENV, SESSION_COOKIE_NAME } from "../../Constants.ts";
import {
  createSession,
  sessionTtlSec,
  type SessionUserPayload,
} from "../../lib/sessionStore.ts";

export const sessionCookieMaxAgeMs = sessionTtlSec * 1000;

/**
 * Shared cookie attributes. `httpOnly` keeps JS from reading them; `sameSite`
 * is "strict" so the cookies never travel on cross-site requests. `secure` is
 * production-only so local development over HTTP keeps working.
 */
export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: "strict",
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
