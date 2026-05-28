export const toDateString = (d: Date) => {
  // en-CA format is YYYY-MM-DD, ideal for mysql
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
};

/**
 * Parse a duration spec into milliseconds.
 *
 * Accepts duration units: ms, s, m, h, d, w.
 *   "30s", "15m", "2h", "10d", "1w" (case-insensitive)
 * A pure number is treated as milliseconds.
 *
 * Falls back to `fallbackMs` when the input is unparseable, undefined,
 * or non-positive — this keeps refresh-token expiry from silently
 * collapsing to "0 ms" on a misconfigured env.
 */
export function parseDurationToMs(
  input: string | number | undefined,
  fallbackMs: number
): number {
  if (input === undefined || input === null) return fallbackMs;

  if (typeof input === "number") {
    return Number.isFinite(input) && input > 0 ? input : fallbackMs;
  }

  const trimmed = String(input).trim();
  if (!trimmed) return fallbackMs;

  // Plain number string = milliseconds
  if (/^\d+$/.test(trimmed)) {
    const ms = Number(trimmed);
    return ms > 0 ? ms : fallbackMs;
  }

  const match = /^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)$/i.exec(trimmed);
  if (!match) return fallbackMs;

  const value = Number(match[1]);
  const unit = match[2]!.toLowerCase();
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000,
  };
  const ms = value * multipliers[unit]!;
  return ms > 0 ? ms : fallbackMs;
}
