import "dotenv/config";

export const PORT = process.env.PORT || 8000;

export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

export const DATABASE_URL = process.env.DATABASE_URL;

export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
export const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "1d";
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
export const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "10d";
export const NODE_ENV = process.env.NODE_ENV || "development";

export const PAYMENT_SERVER_URL =
  process.env.PAYMENT_SERVER_URL || "http://localhost:8080";
export const PAY_SERVICE_SECRET =
  process.env.PAY_SERVICE_SECRET || "dev-pay-secret-change-in-production";
