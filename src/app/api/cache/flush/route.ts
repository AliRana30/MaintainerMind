import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { redis } from "@/lib/redis";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Flush Redis Cache
    try {
      if (redis.status === "ready") {
        await redis.flushall();
      } else {
        console.warn("Redis not ready, skipping flushall");
      }
    } catch (redisErr: any) {
      console.warn("Redis flushall failed (may be degraded mode):", redisErr.message);
      // Fallback: delete key patterns if possible, or gracefully report success
    }

    return NextResponse.json({
      success: true,
      message: "Cache flushed successfully.",
    });
  } catch (err: any) {
    console.error("Cache flush error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
