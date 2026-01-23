import jwt, { type SignOptions } from "jsonwebtoken";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!;

const ACCESS_EXPIRY = (process.env.ACCESS_TOKEN_EXPIRY ||
  "15m") as SignOptions["expiresIn"];
const REFRESH_EXPIRY = (process.env.REFRESH_TOKEN_EXPIRY ||
  "7d") as SignOptions["expiresIn"];

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
};

/**
 * Calculate expiry date for refresh token storage (e.g., for Cookies or DB)
 * Note: This assumes REFRESH_EXPIRY is in a 'days' format if it's a string like "7d"
 */
export const getRefreshTokenExpiry = (): Date => {
  const expiryStr = REFRESH_EXPIRY?.toString() || "7";
  // Extracts the number from strings like "7d" or "30d"
  const days = parseInt(expiryStr.replace(/\D/g, "")) || 7;

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate;
};
