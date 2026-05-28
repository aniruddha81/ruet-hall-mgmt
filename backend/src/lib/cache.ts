import { getRedis } from "./redis.ts";

/** Consistent key namespace (data-key-naming). */
export const cacheKeys = {
  authAccountStudent: (userId: string) =>
    `hallmgmt:auth:account:student:${userId}`,
  authAccountAdmin: (userId: string) => `hallmgmt:auth:account:admin:${userId}`,
  activeAcademicSessions: () => `hallmgmt:auth:sessions:active`,
} as const;

/** Short TTLs on cache keys (ram-ttl). */
export const cacheTtlSec = {
  authAccount: 30,
  activeAcademicSessions: 300,
} as const;

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = await getRedis();
  if (!redis) {
    return null;
  }

  const raw = await redis.get(key);
  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as T;
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSec: number
): Promise<void> {
  const redis = await getRedis();
  if (!redis) {
    return;
  }

  await redis.set(key, JSON.stringify(value), { EX: ttlSec });
}

export async function cacheDel(...keys: string[]): Promise<void> {
  const redis = await getRedis();
  if (!redis || keys.length === 0) {
    return;
  }

  await redis.del(keys);
}

export async function invalidateAuthAccountCache(
  userId: string,
  kind: "STUDENT" | "ADMIN"
): Promise<void> {
  const key =
    kind === "STUDENT"
      ? cacheKeys.authAccountStudent(userId)
      : cacheKeys.authAccountAdmin(userId);
  await cacheDel(key);
}
