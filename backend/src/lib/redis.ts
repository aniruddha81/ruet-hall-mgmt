import { createClient } from "redis";
import { REDIS_URL } from "../Constants.ts";

type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient | undefined;
let connectPromise: Promise<RedisClient | null> | undefined;

/**
 * Shared Redis client (connection pooling via a single long-lived connection).
 * Returns null when REDIS_URL is unset or the broker is unreachable — callers
 * should fall back to MySQL.
 */
export async function getRedis(): Promise<RedisClient | null> {
  if (!REDIS_URL) {
    return null;
  }

  if (client?.isOpen) {
    return client;
  }

  if (!connectPromise) {
    connectPromise = (async () => {
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
  }

  return connectPromise;
}

export async function closeRedis(): Promise<void> {
  if (client?.isOpen) {
    await client.quit();
  }
  client = undefined;
  connectPromise = undefined;
}
