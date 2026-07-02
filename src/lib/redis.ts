import IORedis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";
import { env } from "@/env";

const globalForRedis = global as unknown as { redis: IORedis };

const createRedisInstance = (): IORedis => {
  const correctedUrl = env.REDIS_URL.replace(/^rediis:\/\//i, "redis://");
  const client = new IORedis(correctedUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 4000,
    enableOfflineQueue: false,
    retryStrategy(times) {
      return Math.min(times * 200, 5000);
    },
  });

  client.on("error", (error: any) => {
    if (error.code === "ECONNREFUSED") {
      console.warn(
        `⚠️  [Redis Connection Warning] Unable to connect to Redis at ${correctedUrl}. Make sure Redis is running. The application will continue running with degraded cache performance.`
      );
    } else {
      console.error("[Redis Error]", error);
    }
  });

  return client;
};

export const redis = globalForRedis.redis || createRedisInstance();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export const pingRedis = async (): Promise<string> => {
  try {
    if (process.env.NODE_ENV === "production" && process.env.UPSTASH_REDIS_REST_URL) {
      const upstash = new UpstashRedis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
      });
      const res = await upstash.ping();
      return res === "PONG" || res ? "ok" : "error";
    } else {
      const res = await redis.ping();
      return res === "PONG" || res ? "ok" : "error";
    }
  } catch (error) {
    console.error("[Redis Ping Error]", error);
    return "error";
  }
};

export async function getCachedValue(key: string): Promise<string | null> {
  if (redis.status !== "ready") return null;
  try {
    // Wrap in a promise race to enforce a hard 1.5s timeout even if connection state reports ready
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
    const getPromise = redis.get(key);
    return await Promise.race([getPromise, timeoutPromise]);
  } catch (err) {
    console.error(`[Redis Safe Get Error] key: ${key}`, err);
    return null;
  }
}

export async function setCachedValue(key: string, value: string, mode?: "EX", duration?: number): Promise<void> {
  if (redis.status !== "ready") return;
  try {
    if (mode === "EX" && duration !== undefined) {
      await redis.set(key, value, "EX", duration);
    } else {
      await redis.set(key, value);
    }
  } catch (err) {
    console.error(`[Redis Safe Set Error] key: ${key}`, err);
  }
}

export async function deleteCachedValue(key: string): Promise<void> {
  if (redis.status !== "ready") return;
  try {
    await redis.del(key);
  } catch (err) {
    console.error(`[Redis Safe Del Error] key: ${key}`, err);
  }
}

export default redis;
