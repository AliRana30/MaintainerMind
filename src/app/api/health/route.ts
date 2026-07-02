import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pingRedis } from "@/lib/redis";

export async function GET() {
  let dbStatus = "ok";
  let redisStatus = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("[Health Check DB Error]", error);
    dbStatus = "error";
  }

  try {
    redisStatus = await pingRedis();
  } catch (error) {
    console.error("[Health Check Redis Error]", error);
    redisStatus = "error";
  }

  const status = (dbStatus === "ok" && redisStatus === "ok") ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      db: dbStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    },
    {
      status: status === "ok" ? 200 : 503,
    }
  );
}

export const dynamic = "force-dynamic";
