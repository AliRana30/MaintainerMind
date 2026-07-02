import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis, getCachedValue, setCachedValue, deleteCachedValue } from "@/lib/redis";
import { cogneeImprove } from "@/lib/cognee-client";
import { auth } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await params;
    const { userId } = await auth();
    const body = await req.json();
    const { datasetName } = body;

    if (!datasetName) {
      return NextResponse.json({ error: "Missing datasetName in request body" }, { status: 400 });
    }

    const rateLimitKey = `cognee:improve:last:${datasetName}`;
    const isRateLimited = await getCachedValue(rateLimitKey);
    if (isRateLimited) {
      return NextResponse.json(
        { error: "Memory improvement cycle is already running or has been run recently. Please wait." },
        { status: 429 }
      );
    }

    // Resolve dbRepoId
    let dbRepoId = repoId;
    let foundRepo = null;
    if (repoId.includes("-")) {
      const parts = repoId.split("-");
      const owner = parts[0];
      const name = parts.slice(1).join("-");
      foundRepo = await prisma.repository.findFirst({
        where: {
          OR: [
            { id: repoId },
            { fullName: `${owner}/${name}` },
            { name: name }
          ]
        }
      });
    } else {
      foundRepo = await prisma.repository.findFirst({
        where: {
          OR: [
            { id: repoId },
            { name: repoId }
          ]
        }
      });
    }
    if (foundRepo) {
      dbRepoId = foundRepo.id;
    }

    // Resolve Clerk User ID to local DB User ID
    let localUser = null;
    if (userId) {
      localUser = await prisma.user.findUnique({
        where: { clerkId: userId }
      });
    }

    // Trigger cognee improve operation in background
    try {
      await cogneeImprove(datasetName, {
        runInBackground: true,
        buildGlobalContextIndex: true,
        enrichmentTasks: ["summarization", "relationship-pruning"]
      });
    } catch (cogneeErr: any) {
      console.warn("[Memory Improve] Cognee improve() failed, continuing with DB update only:", cogneeErr.message);
    }

    // Write to PostgreSQL database
    const dataset = await prisma.dataset.findUnique({
      where: { repoId: dbRepoId }
    });
    if (dataset) {
      await prisma.dataset.update({
        where: { id: dataset.id },
        data: {
          processingStatus: "PROCESSING",
          lastImprovedAt: new Date()
        }
      });
    }

    // Write AuditLog
    await prisma.auditLog.create({
      data: {
        userId: localUser?.id || null,
        action: "IMPROVE",
        entityType: "REPOSITORY",
        entityId: dbRepoId,
        metadata: {
          datasetName,
          timestamp: new Date().toISOString()
        }
      }
    });

    // Set Redis rate limit key with 1800s (30m) TTL
    setCachedValue(rateLimitKey, "running", "EX", 1800).catch((err) =>
      console.error("[Memory Improve Cache Write Error]", err)
    );

    // Also clear stats cache so dashboard shows processing status
    deleteCachedValue(`memory:stats:${dbRepoId}`).catch((err) =>
      console.error("[Memory Improve Cache Prune Error]", err)
    );

    return NextResponse.json({ triggered: true });
  } catch (error: any) {
    console.error("Failed to trigger memory improvement:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
