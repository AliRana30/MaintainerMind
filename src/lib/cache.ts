import { redis, getCachedValue, setCachedValue, deleteCachedValue } from "./redis";
import crypto from "crypto";

// Curated TTL settings in seconds as defined in the Redis Caching Strategy
export const CACHE_TTL = {
  COGNEE_RECALL: 300,      // 5 minutes
  GH_REPO: 60,             // 1 minute
  GH_PR: 30,               // 30 seconds
  GH_PR_FILES: 120,        // 2 minutes
  ANALYTICS_STATS: 120,    // 2 minutes
  ANALYTICS_QUALITY: 60,   // 1 minute
  COGNEE_STATUS: 8,        // 8 seconds
  COGNEE_DATASETS: 600,    // 10 minutes
  CHAT_SESSION: 1800,      // 30 minutes
};

// Strongly typed key pattern generators to avoid typos across the codebase
export const cacheKeys = {
  cogneeRecall: (datasetName: string, query: string) => {
    const queryHash = crypto.createHash("sha256").update(query).digest("hex");
    return `cognee:recall:${datasetName}:${queryHash}`;
  },
  ghRepo: (owner: string, repo: string) => `gh:repo:${owner}/${repo}`,
  ghPr: (owner: string, repo: string, prNumber: number) => `gh:pr:${owner}/${repo}:${prNumber}`,
  ghPrFiles: (owner: string, repo: string, prNumber: number) => `gh:pr:${owner}/${repo}:${prNumber}:files`,
  analyticsStats: (repoId: string) => `analytics:repo:${repoId}:stats`,
  analyticsQuality: (repoId: string) => `analytics:repo:${repoId}:quality`,
  cogneeStatus: (datasetId: string) => `cognee:status:${datasetId}`,
  cogneeDatasets: (userId: string) => `cognee:datasets:${userId}`,
  chatSession: (sessionId: string) => `chat:session:${sessionId}:messages`,
};

/**
 * Retrieves an object from Redis cache, parsing JSON.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await getCachedValue(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`[Cache Read Error] Key: ${key}`, error);
    return null;
  }
}

/**
 * Saves an object to Redis cache, stringifying to JSON.
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  try {
    await setCachedValue(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    console.error(`[Cache Write Error] Key: ${key}`, error);
  }
}

/**
 * Removes a specific cache key from Redis.
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await deleteCachedValue(key);
  } catch (error) {
    console.error(`[Cache Invalidation Error] Key: ${key}`, error);
  }
}

/**
 * central Stale-While-Revalidate (SWR) Caching Strategy
 * If Redis hit: returns cached data immediately, then fetches fresh data in background.
 * If Redis miss: fetches fresh data immediately, caches it, and returns.
 */
export async function getStaleWhileRevalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const cached = await getCached<T>(key);
  if (cached !== null) {
    // Fire background revalidation asynchronously
    fetcher()
      .then((freshData) => setCached(key, freshData, ttlSeconds))
      .catch((err) =>
        console.error(`[Background Revalidation Failed] Key: ${key}`, err)
      );
    return cached; // Return stale value instantly
  }

  // Cache miss — fetch synchronously and set
  const freshData = await fetcher();
  await setCached(key, freshData, ttlSeconds);
  return freshData;
}
