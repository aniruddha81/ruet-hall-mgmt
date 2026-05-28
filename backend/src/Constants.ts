import "dotenv/config";

export const PORT = process.env.PORT || 8000;

export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

export const DATABASE_URL = process.env.DATABASE_URL;

export const NODE_ENV = process.env.NODE_ENV || "development";

/** httpOnly cookie holding the opaque Redis session id. */
export const SESSION_COOKIE_NAME = "sessionId";

/** Live session TTL in Redis (default 10 days). */
export const SESSION_TTL = process.env.SESSION_TTL || "10d";

/** Required for auth (cloud Redis connection string). */
export const REDIS_URL = process.env.REDIS_URL;

export const PAYMENT_SERVER_URL =
  process.env.PAYMENT_SERVER_URL || "http://localhost:8080";
export const PAY_SERVICE_SECRET =
  process.env.PAY_SERVICE_SECRET || "dev-pay-secret-change-in-production";
