/** Fallback when API omits resendCooldownSec (matches backend STUDENT_OTP_RESEND_COOLDOWN_SEC). */
export const DEFAULT_OTP_RESEND_COOLDOWN_SEC = 60;

export function getResendCooldownSec(data: unknown): number {
  if (
    data &&
    typeof data === "object" &&
    "resendCooldownSec" in data &&
    typeof (data as { resendCooldownSec: unknown }).resendCooldownSec ===
      "number"
  ) {
    const sec = (data as { resendCooldownSec: number }).resendCooldownSec;
    if (sec > 0) return sec;
  }
  return DEFAULT_OTP_RESEND_COOLDOWN_SEC;
}
