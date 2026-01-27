import crypto from "crypto";

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createJti() {
  return crypto.randomBytes(16).toString("hex");
}
