"use client";

import { useCallback, useEffect, useState } from "react";

export function useOtpResendCooldown(initialSeconds = 0) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const startCooldown = useCallback((seconds: number) => {
    if (seconds > 0) setSecondsLeft(seconds);
  }, []);

  const canResend = secondsLeft <= 0;

  const resendLabel =
    secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : "Resend code";

  return { secondsLeft, canResend, startCooldown, resendLabel };
}
