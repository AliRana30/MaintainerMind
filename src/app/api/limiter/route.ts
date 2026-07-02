import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { identifier } = await req.json();
    if (!identifier) {
      return NextResponse.json({ allowed: true });
    }

    const key = `rate_limit:api:${identifier}`;
    const limit = 300;
    const windowSeconds = 60;
    
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const clearBefore = now - windowMs;

    if (redis.status !== "ready") {
      return NextResponse.json({ allowed: true, limit, remaining: limit, reset: 0 });
    }

    const transaction = redis.multi();
    transaction.zremrangebyscore(key, 0, clearBefore);
    transaction.zadd(key, now, `${now}-${Math.random()}`);
    transaction.zcard(key);
    transaction.expire(key, windowSeconds);

    const results = await transaction.exec();
    if (!results) {
      return NextResponse.json({ allowed: true, limit, remaining: limit, reset: 0 });
    }

    const requestCount = results[2][1] as number;
    const allowed = requestCount <= limit;
    const remaining = Math.max(0, limit - requestCount);
    const reset = Math.ceil((now + windowMs) / 1000);

    return NextResponse.json({
      allowed,
      limit,
      remaining,
      reset,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ 
      allowed: true, 
      limit: 300, 
      remaining: 300, 
      reset: 0, 
      error: error.message 
    });
  }
}
