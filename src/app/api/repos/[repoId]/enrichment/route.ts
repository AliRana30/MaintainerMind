import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enrichmentQueue } from "@/server/queues";

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

    const job = await enrichmentQueue.add(
      "manual-enrichment",
      { repoId: repo.id, triggerSource: "manual" },
      {
        jobId: `manual-enrichment:${repo.id}:${Date.now()}`,
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    return NextResponse.json({ success: true, queued: true, jobId: job.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
