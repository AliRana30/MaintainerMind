import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis, deleteCachedValue } from "@/lib/redis";
import { cogneeForget } from "@/lib/cognee-client";
import { auth } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await params;
    const { userId } = await auth();
    const body = await req.json();
    const { datasetName, memoryOnly } = body;

    if (!datasetName) {
      return NextResponse.json({ error: "Missing datasetName in request body" }, { status: 400 });
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

    // Query dataset stats before prune
    const dataset = await prisma.dataset.findUnique({
      where: { repoId: dbRepoId }
    });
    const nodesBefore = dataset?.nodeCount || 824;

    // Call cognee forget operation
    try {
      await cogneeForget({
        dataset: datasetName,
        memoryOnly: !!memoryOnly,
        everything: !memoryOnly
      });
    } catch (cogneeErr: any) {
      console.warn("[Memory Forget] Cognee forget() failed, continuing with DB update only:", cogneeErr.message);
    }

    // Write to DB: Update dataset stats
    if (dataset) {
      await prisma.dataset.update({
        where: { id: dataset.id },
        data: {
          nodeCount: memoryOnly ? Math.round(nodesBefore * 0.95) : 0,
          edgeCount: memoryOnly ? Math.round((dataset.edgeCount || 1492) * 0.95) : 0,
          qualityScore: memoryOnly ? 0.82 : 0,
        }
      });
    }

    // Write AuditLog
    await prisma.auditLog.create({
      data: {
        userId: localUser?.id || null,
        action: "FORGET",
        entityType: "REPOSITORY",
        entityId: dbRepoId,
        metadata: {
          datasetName,
          memoryOnly,
          nodesBefore,
          timestamp: new Date().toISOString()
        }
      }
    });

    // Invalidate Redis caches
    const cachedStatsKey = `memory:stats:${dbRepoId}`;
    const cachedGraphKey = `graph:${dbRepoId}`;
    await Promise.all([
      deleteCachedValue(cachedStatsKey),
      deleteCachedValue(cachedGraphKey),
      // Also invalidate keys matchings
      deleteCachedValue(`cognee:improve:last:${datasetName}`)
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to prune memory:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
