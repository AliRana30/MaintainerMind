import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

const backfillQueue = new Queue("repo-backfill", { connection: redis });

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { repoId } = await params;

    // Resolve repository from DB with slug resolution support
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
        },
      });
    } else {
      foundRepo = await prisma.repository.findFirst({
        where: {
          OR: [
            { id: repoId },
            { name: repoId }
          ]
        },
      });
    }

    if (!foundRepo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }
    const repo = foundRepo;

    // Reset sync status to SYNCING
    await prisma.repository.update({
      where: { id: repo.id },
      data: { syncStatus: "SYNCING" },
    });

    // Reset dataset status
    await prisma.dataset.updateMany({
      where: { repoId: repo.id },
      data: { processingStatus: "PROCESSING" },
    });

    // Re-queue the backfill job
    await backfillQueue.add(
      "backfill-repo",
      {
        repoId: repo.id,
        fullName: repo.fullName,
        owner: repo.owner,
        name: repo.name,
        installationId: repo.githubInstallationId,
      },
      {
        jobId: `retry-backfill:${repo.id}:${Date.now()}`,
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    return NextResponse.json({ success: true, message: "Sync retry queued" });
  } catch (error: any) {
    console.error("[Retry Sync Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
