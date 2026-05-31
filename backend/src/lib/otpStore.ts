import { randomInt } from "crypto";
import { getRedis } from "./redis.ts";
import ApiError from "../utils/ApiError.ts";

/** Email verification OTP lifetime (5–10 minutes). */
export const STUDENT_VERIFY_OTP_TTL_SEC = 7 * 60;

export const otpKeys = {
  studentEmailVerify: (userId: string) =>
    `hallmgmt:auth:otp:student-verify:${userId}`,
} as const;

async function requireRedis() {
  const redis = await getRedis();
  if (!redis) {
    throw new ApiError(
      503,
      "Verification service is unavailable. Ensure Redis is running and REDIS_URL is set."
    );
  }
  return redis;
}

export function generateOtpCode(): string {
  return String(randomInt(100_000, 1_000_000));
}

export async function storeStudentVerifyOtp(
  userId: string,
  otp: string
): Promise<void> {
  const redis = await requireRedis();
  await redis.set(otpKeys.studentEmailVerify(userId), otp, {
    EX: STUDENT_VERIFY_OTP_TTL_SEC,
  });
}

export async function verifyAndConsumeStudentOtp(
  userId: string,
  otp: string
): Promise<boolean> {
  const redis = await requireRedis();
  const key = otpKeys.studentEmailVerify(userId);
  const stored = await redis.get(key);
  if (!stored || stored !== otp.trim()) {
    return false;
  }
  await redis.del(key);
  return true;
}

export async function deleteStudentVerifyOtp(userId: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) {
    return;
  }
  await redis.del(otpKeys.studentEmailVerify(userId));
}
