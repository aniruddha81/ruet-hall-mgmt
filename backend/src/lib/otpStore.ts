import { randomInt } from "crypto";
import { getRedis } from "./redis.ts";
import ApiError from "../utils/ApiError.ts";

/** Email verification OTP lifetime (5–10 minutes). */
export const STUDENT_VERIFY_OTP_TTL_SEC = 7 * 60;

/** Minimum wait before another verification email can be sent. */
export const STUDENT_OTP_RESEND_COOLDOWN_SEC = 60;

export const otpKeys = {
  studentEmailVerify: (userId: string) =>
    `hallmgmt:auth:otp:student-verify:${userId}`,
  studentResendCooldown: (userId: string) =>
    `hallmgmt:auth:otp:resend-cooldown:${userId}`,
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

export async function getStudentOtpResendCooldownRemaining(
  userId: string
): Promise<number> {
  const redis = await getRedis();
  if (!redis) {
    return 0;
  }
  const ttl = await redis.ttl(otpKeys.studentResendCooldown(userId));
  return ttl > 0 ? ttl : 0;
}

export async function assertCanResendStudentOtp(userId: string): Promise<void> {
  const remaining = await getStudentOtpResendCooldownRemaining(userId);
  if (remaining > 0) {
    throw new ApiError(
      429,
      `Please wait ${remaining} seconds before requesting another code.`,
      [],
      {
        retryAfterSec: remaining,
        resendCooldownSec: STUDENT_OTP_RESEND_COOLDOWN_SEC,
      }
    );
  }
}

export async function markStudentOtpResendCooldown(userId: string): Promise<void> {
  const redis = await requireRedis();
  await redis.set(otpKeys.studentResendCooldown(userId), "1", {
    EX: STUDENT_OTP_RESEND_COOLDOWN_SEC,
  });
}
