import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { prisma } from "@/lib/prisma";

// Initialize Rate Limiter if Upstash credentials are present
const redisAvailable = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

let ratelimit: Ratelimit | null = null;
if (redisAvailable) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  // 5 requests per minute per IP
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1m"),
  });
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const identifier = `login_limit:${ip}`;

    // 1. Check Rate Limit
    if (ratelimit) {
      const { success, reset } = await ratelimit.limit(identifier);
      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        return NextResponse.json(
          { 
            error: `Too many attempts, try again in ${retryAfter}s`,
            retryAfter 
          },
          { status: 429 }
        );
      }
    }

    // 2. Parse request payload
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 3. Simple verification (simulated or database check)
    // Find if user exists in the DB
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // For demo/seeding purposes, if email is correct, authenticate user
    // In a real app we would check bcrypt password hashes
    if (user) {
      // Create session cookie or token
      const response = NextResponse.json({ success: true, user });
      response.cookies.set("session", user.id, {
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
        httpOnly: true,
      });
      return response;
    }

    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  } catch (err: any) {
    console.error("Error in login endpoint:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
