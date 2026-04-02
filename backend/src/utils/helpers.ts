import crypto from "crypto";

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createJti() {
  return crypto.randomBytes(16).toString("hex");
}

export const toDateString = (d: Date) => {
  // en-CA format is YYYY-MM-DD, ideal for mysql
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
};
