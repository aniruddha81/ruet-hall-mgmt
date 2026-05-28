import { randomUUID } from "crypto";
import type { Request } from "express";
import { SESSION_TTL } from "../Constants.ts";
import type { Role } from "../types/enums.ts";
import ApiError from "../utils/ApiError.ts";
import { parseDurationToMs } from "../utils/helpers.ts";
import { getRedis } from "./redis.ts";

const MAX_ACTIVE_SESSIONS_PER_USER = 2;
const DEFAULT_SESSION_MS = 10 * 24 * 60 * 60 * 1000; // 10 days

export const sessionTtlSec = Math.ceil(
  parseDurationToMs(SESSION_TTL, DEFAULT_SESSION_MS) / 1000
);

export type SessionUserPayload = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  rollNumber?: string;
};

export type LiveSession = SessionUserPayload & {
  sessionId: string;
  ip: string;
  userAgent: string;
  createdAt: string;
};

const sessionKey = (sessionId: string) => `hallmgmt:session:${sessionId}`;
const userSessionsKey = (userId: string) => `hallmgmt:sessions:user:${userId}`;

async function requireRedis() {
  const redis = await getRedis();
  if (!redis) {
    throw new ApiError(
      503,
      "Session store is unavailable. Ensure Redis is running and REDIS_URL is set."
    );
  }
  return redis;
}

/** Drop session ids from the user set whose Redis keys have expired. */
async function pruneStaleUserSessionRefs(userId: string): Promise<string[]> {
  const redis = await requireRedis();
  const userKey = userSessionsKey(userId);
  const sessionIds = await redis.sMembers(userKey);
  const active: string[] = [];

  for (const id of sessionIds) {
    const exists = await redis.exists(sessionKey(id));
    if (exists) {
      active.push(id);
    } else {
      await redis.sRem(userKey, id);
    }
  }

  return active;
}

export async function countActiveSessions(userId: string): Promise<number> {
  const active = await pruneStaleUserSessionRefs(userId);
  return active.length;
}

export async function enforceSessionLimitOrThrow(
  userId: string,
  force?: boolean
): Promise<void> {
  const activeCount = await countActiveSessions(userId);
  if (activeCount < MAX_ACTIVE_SESSIONS_PER_USER) {
    return;
  }

  if (force) {
    await revokeAllUserSessions(userId);
    return;
  }

  throw new ApiError(
    403,
    "Maximum active sessions reached (2 devices). Log out on another device, wait for sessions to expire, or sign in again and choose to end all other sessions."
  );
}

export async function getSession(
  sessionId: string
): Promise<LiveSession | null> {
  const redis = await getRedis();
  if (!redis) {
    return null;
  }

  const raw = await redis.get(sessionKey(sessionId));
  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as LiveSession;
}

/** Extend session TTL on activity (sliding window). */
export async function touchSession(sessionId: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) {
    return;
  }

  const key = sessionKey(sessionId);
  const raw = await redis.get(key);
  if (!raw) {
    return;
  }

  await redis.set(key, raw, { EX: sessionTtlSec });
}

export async function createSession(
  req: Request,
  payload: SessionUserPayload
): Promise<LiveSession> {
  const redis = await requireRedis();
  const sessionId = randomUUID();
  const record: LiveSession = {
    sessionId,
    ...payload,
    ip: String(req.ip ?? ""),
    userAgent: req.headers["user-agent"] ?? "",
    createdAt: new Date().toISOString(),
  };

  await redis.set(sessionKey(sessionId), JSON.stringify(record), {
    EX: sessionTtlSec,
  });
  await redis.sAdd(userSessionsKey(payload.userId), sessionId);

  return record;
}

export async function revokeSession(sessionId: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) {
    return;
  }

  const raw = await redis.get(sessionKey(sessionId));
  if (raw) {
    const parsed = JSON.parse(raw) as LiveSession;
    await redis.sRem(userSessionsKey(parsed.userId), sessionId);
  }

  await redis.del(sessionKey(sessionId));
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) {
    return;
  }

  const sessionIds = await pruneStaleUserSessionRefs(userId);
  if (sessionIds.length > 0) {
    await redis.del(sessionIds.map(sessionKey));
  }
  await redis.del(userSessionsKey(userId));
}

export async function listUserSessions(userId: string): Promise<LiveSession[]> {
  const redis = await requireRedis();
  const sessionIds = await pruneStaleUserSessionRefs(userId);
  const sessions: LiveSession[] = [];

  for (const id of sessionIds) {
    const raw = await redis.get(sessionKey(id));
    if (raw) {
      sessions.push(JSON.parse(raw) as LiveSession);
    }
  }

  sessions.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return sessions;
}
