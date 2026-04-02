import "dotenv/config";

export const MAIN_SERVER_URL =
  process.env.MAIN_SERVER_URL || "http://localhost:8000";
export const PORT = process.env.PORT || 8080;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const PAY_SERVICE_SECRET =
  process.env.PAY_SERVICE_SECRET || "dev-pay-secret-change-in-production";
