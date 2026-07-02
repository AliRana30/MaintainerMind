import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { getToken } from "next-auth/jwt";

const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/api/auth",
  "/api/health",
];

const isPublicRoute = (path: string) => {
  return publicRoutes.some(route => path.startsWith(route));
};

const edgeLimiterAvailable = process.env.NODE_ENV === "production" && !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

let redis: Redis | null = null;
let limiters: {
  webhook: Ratelimit;
  chat: Ratelimit;
  api: Ratelimit;
} | null = null;

if (edgeLimiterAvailable) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  limiters = {
    webhook: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "10s") }),
    chat: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1m") }),
    api: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(300, "1m") }),
  };
}

export default async function middleware(req: NextRequest) {
  const isPublic = isPublicRoute(req.nextUrl.pathname);
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");

  // Allow custom session or NextAuth session tokens
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.id || null;
  const legacySession = req.cookies.get("session")?.value;

  if (!isPublic) {
    if (!userId && !legacySession) {
      if (isApiRoute) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Rate Limiting Layer (API only, excluding public routes like /api/health)
  if (isApiRoute && !req.nextUrl.pathname.startsWith("/api/health") && limiters) {
    const path = req.nextUrl.pathname;
    let allowed = true;
    let limiter: Ratelimit;
    let identifier = (userId as string) || req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";

    if (path.startsWith("/api/webhooks/github")) {
      limiter = limiters.webhook;
      identifier = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "github-webhook";
    } else if (path.startsWith("/api/chat/stream")) {
      limiter = limiters.chat;
      identifier = (userId as string) || req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
    } else {
      limiter = limiters.api;
      identifier = (userId as string) || req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
    }

    try {
      const result = await limiter.limit(identifier);
      allowed = result.success;
    } catch (err) {
      console.error("[Rate Limiting Error]", err);
    }

    if (!allowed) {
      return new Response("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": "10",
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html|css|js|jpe?g|webp|png|gif|svg|css|js|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
