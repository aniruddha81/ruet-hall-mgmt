import "dotenv/config";

export const PORT = process.env.PORT || 8000;

export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

export const DATABASE_URL = process.env.DATABASE_URL;

export const NODE_ENV = process.env.NODE_ENV || "development";

/** httpOnly cookie holding the opaque Redis session id. */
export const SESSION_COOKIE_NAME = "sessionId";
export const SESSION_COOKIE_SAMESITE = process.env.SESSION_COOKIE_SAMESITE;
export const SESSION_COOKIE_SECURE = process.env.SESSION_COOKIE_SECURE;

/** Live session TTL in Redis (default 10 days). */
export const SESSION_TTL = process.env.SESSION_TTL || "10d";

/** Required for auth (cloud Redis connection string). */
export const REDIS_URL = process.env.REDIS_URL;

export const SSLCOMMERZ_STORE_ID = process.env.SSLCOMMERZ_STORE_ID;
export const SSLCOMMERZ_STORE_PASSWORD = process.env.SSLCOMMERZ_STORE_PASSWORD;
export const SSLCOMMERZ_IS_SANDBOX = process.env.SSLCOMMERZ_IS_SANDBOX !== "false";
export const API_PUBLIC_URL = process.env.API_PUBLIC_URL;
export const STUDENT_URL = process.env.STUDENT_URL || "http://localhost:3001";
export const ADMIN_URL = process.env.ADMIN_URL || "http://localhost:4001";
