import jwt, { type SignOptions } from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRY,
  ACCESS_TOKEN_SECRET,
  NODE_ENV,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_TOKEN_SECRET,
} from "../../Constants.ts";
import type {
  AccessTokenPayload,
  IssueAuthOptions,
  RefreshTokenPayload,
} from "./auth.d.ts";
import type { CookieOptions } from "express";
import { createJti, hashToken } from "../../utils/helpers.ts";
import { refreshTokens } from "../../db/models/index.ts";
import { db } from "../../index.ts";
import { randomUUID } from "crypto";

export const signAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET!, {
    expiresIn: (ACCESS_TOKEN_EXPIRY || "15m") as SignOptions["expiresIn"],
  });
};

export const signRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET!, {
    expiresIn: (REFRESH_TOKEN_EXPIRY || "10d") as SignOptions["expiresIn"],
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET!) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET!) as RefreshTokenPayload;
};

/**
 * Calculate expiry date for refresh token storage (e.g., for Cookies or DB)
 * Note: This assumes REFRESH_TOKEN_EXPIRY is in a 'days' format if it's a string like "7d"
 */
export const getRefreshTokenExpiry = (): Date => {
  const expiryStr =
    ((REFRESH_TOKEN_EXPIRY || "10d") as SignOptions["expiresIn"])?.toString() ||
    "10";
  // Extracts the number from strings like "7d" or "30d"
  const days = parseInt(expiryStr.replace(/\D/g, "")) || 7;

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate;
};

export const options: CookieOptions = {
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: "strict",
};

// This function can be used in both student and admin login flows to issue tokens and set cookies
export const issueAuthTokenAndSetCookies = async ({
  req,
  res,
  cookiePath = "/",
  tokenPayload,
  accessMaxAge = 15 * 60 * 1000,
  refreshMaxAge = 10 * 24 * 60 * 60 * 1000,
}: IssueAuthOptions) => {
  const jti = createJti();
  const refreshToken = signRefreshToken({ ...tokenPayload, jti });

  await db.insert(refreshTokens).values({
    id: randomUUID(),
    jti,
    userId: tokenPayload.userId,
    tokenHash: hashToken(refreshToken),
    ip: String(req.ip),
    userAgent: req.headers["user-agent"] || "",
    expiresAt: getRefreshTokenExpiry(),
  });

  return res
    .status(200)
    .cookie("accessToken", signAccessToken(tokenPayload), {
      ...options,
      maxAge: accessMaxAge,
      path: cookiePath,
    })
    .cookie("refreshToken", refreshToken, {
      ...options,
      maxAge: refreshMaxAge,
      path: cookiePath,
    });
};
