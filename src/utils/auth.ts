import jwt, { type SignOptions } from "jsonwebtoken";
import type { TokenPayload } from "../types/auth";
import {
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_TOKEN_SECRET,
} from "../Constants";

export const generateAccessAndRefreshTokens = (
  payload: TokenPayload
): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET!, {
    expiresIn: (ACCESS_TOKEN_EXPIRY || "1d") as SignOptions["expiresIn"],
  });
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET!, {
    expiresIn: (REFRESH_TOKEN_EXPIRY || "10d") as SignOptions["expiresIn"],
  });
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET!) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET!) as TokenPayload;
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
