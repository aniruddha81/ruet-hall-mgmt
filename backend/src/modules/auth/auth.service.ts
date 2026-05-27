import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import type { CookieOptions, Request, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRY,
  ACCESS_TOKEN_SECRET,
  NODE_ENV,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_TOKEN_SECRET,
} from "../../Constants.ts";
import { db } from "../../db/index.ts";
import { refreshTokens } from "../../db/models/index.ts";
import { createJti, hashToken, parseDurationToMs } from "../../utils/helpers.ts";
import type {
  AccessTokenPayload,
  IssueAuthOptions,
  RefreshTokenPayload,
} from "./auth.d.ts";

const DEFAULT_ACCESS_TOKEN_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_REFRESH_TOKEN_MS = 10 * 24 * 60 * 60 * 1000; // 10 days

export const accessTokenMaxAgeMs = parseDurationToMs(
  ACCESS_TOKEN_EXPIRY,
  DEFAULT_ACCESS_TOKEN_MS
);
export const refreshTokenMaxAgeMs = parseDurationToMs(
  REFRESH_TOKEN_EXPIRY,
  DEFAULT_REFRESH_TOKEN_MS
);

export const signAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET!, {
    expiresIn: (ACCESS_TOKEN_EXPIRY ||
      `${DEFAULT_ACCESS_TOKEN_MS}`) as SignOptions["expiresIn"],
  });
};

export const signRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET!, {
    expiresIn: (REFRESH_TOKEN_EXPIRY ||
      `${DEFAULT_REFRESH_TOKEN_MS}`) as SignOptions["expiresIn"],
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET!) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET!) as RefreshTokenPayload;
};

/**
 * Refresh-token DB-row expiry. Always derived from the same source as the
 * signed JWT (`REFRESH_TOKEN_EXPIRY`) using `parseDurationToMs`, so the DB
 * row and the JWT can never disagree.
 */
export const getRefreshTokenExpiry = (): Date => {
  return new Date(Date.now() + refreshTokenMaxAgeMs);
};

/**
 * Shared cookie attributes. `httpOnly` keeps JS from reading them; `sameSite`
 * is "strict" so the cookies never travel on cross-site requests. `secure` is
 * production-only so local development over HTTP keeps working.
 */
export const options: CookieOptions = {
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: "strict",
};

/**
 * Atomically set both auth cookies on a response.
 */
export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
  cookiePath: string = "/"
): Response => {
  return res
    .cookie("accessToken", accessToken, {
      ...options,
      maxAge: accessTokenMaxAgeMs,
      path: cookiePath,
    })
    .cookie("refreshToken", refreshToken, {
      ...options,
      maxAge: refreshTokenMaxAgeMs,
      path: cookiePath,
    });
};

/**
 * Atomically clear both auth cookies. Always pair this with any code path
 * that rejects a session (revoked token, account disabled, etc.) so the
 * browser doesn't keep replaying a dead `refreshToken` cookie.
 */
export const clearAuthCookies = (
  res: Response,
  cookiePath: string = "/"
): Response => {
  return res
    .clearCookie("accessToken", { ...options, path: cookiePath })
    .clearCookie("refreshToken", { ...options, path: cookiePath });
};

/**
 * Issue a brand-new access+refresh token pair, persist the refresh-token
 * record, and set both cookies on the response. Used at login & register.
 */
export const issueAuthTokenAndSetCookies = async ({
  req,
  res,
  cookiePath = "/",
  tokenPayload,
}: IssueAuthOptions): Promise<Response> => {
  const jti = createJti();
  const refreshTokenJwt = signRefreshToken({
    userId: tokenPayload.userId,
    role: tokenPayload.role,
    jti,
  });
  const accessTokenJwt = signAccessToken(tokenPayload);

  await db.insert(refreshTokens).values({
    id: randomUUID(),
    jti,
    userId: tokenPayload.userId,
    tokenHash: hashToken(refreshTokenJwt),
    ip: String(req.ip ?? ""),
    userAgent: req.headers["user-agent"] ?? "",
    expiresAt: getRefreshTokenExpiry(),
  });

  return setAuthCookies(res, accessTokenJwt, refreshTokenJwt, cookiePath).status(
    200
  );
};

/**
 * Rotate an existing refresh-token row in place: new jti, new tokenHash,
 * new expiry, updated ip/userAgent. Returns the rotated refresh & access
 * tokens but does NOT touch cookies — the caller composes the response.
 */
export const rotateRefreshTokenRecord = async ({
  req,
  rowId,
  tokenPayload,
}: {
  req: Request;
  rowId: string;
  tokenPayload: AccessTokenPayload;
}): Promise<{ accessToken: string; refreshToken: string }> => {
  const newJti = createJti();
  const refreshTokenJwt = signRefreshToken({
    userId: tokenPayload.userId,
    role: tokenPayload.role,
    jti: newJti,
  });
  const accessTokenJwt = signAccessToken(tokenPayload);

  await db
    .update(refreshTokens)
    .set({
      jti: newJti,
      tokenHash: hashToken(refreshTokenJwt),
      ip: String(req.ip ?? ""),
      userAgent: req.headers["user-agent"] ?? "",
      expiresAt: getRefreshTokenExpiry(),
    })
    .where(eq(refreshTokens.id, rowId));

  return { accessToken: accessTokenJwt, refreshToken: refreshTokenJwt };
};

/**
 * Revoke every refresh token for a user. Used after refresh-token reuse is
 * detected (suspected compromise) and on `logout-all`.
 */
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
};
