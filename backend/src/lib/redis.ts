import { createClient, type RedisClientType } from "redis";
import { REDIS_URL } from "../Constants.ts";

let client: RedisClientType | undefined;
let connectPromise: Promise<RedisClientType | null> | undefined;

/**
 * Shared Redis client (connection pooling via a single long-lived connection).
 * Returns null when REDIS_URL is unset or the broker is unreachable — callers
 * should fall back to PostgreSQL.
 */
export async function getRedis(): Promise<RedisClientType | null> {
  if (!REDIS_URL) {
    return null;
  }

  if (client?.isReady) {
    return client;
  }

  connectPromise ??= (async (): Promise<RedisClientType | null> => {
    const next = createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: 5_000,
        reconnectStrategy: (retries) => Math.min(retries * 100, 3_000),
      },
    });

    next.on("error", (err) => {
      console.error("[redis]", err.message);
    });

    try {
      await next.connect();
      client = next;
      return next;
    } catch (err) {
      console.warn(
        "[redis] unavailable — continuing without cache:",
        err instanceof Error ? err.message : err
      );
      connectPromise = undefined;
      return null;
    }
  })();

  return connectPromise;
}

export async function closeRedis(): Promise<void> {
  if (client?.isOpen) {
    await client.close();
  }
  client = undefined;
  connectPromise = undefined;
}
