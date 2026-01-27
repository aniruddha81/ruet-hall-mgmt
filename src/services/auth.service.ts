import jwt, { type SignOptions } from "jsonwebtoken";
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from "../types/auth";
import {
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_TOKEN_SECRET,
} from "../Constants";

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

export const verifyAccessToken = (token: string) : AccessTokenPayload => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET!) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string) : RefreshTokenPayload => {
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