import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
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
        include: { dataset: true },
      });
    } else {
      foundRepo = await prisma.repository.findFirst({
        where: {
          OR: [
            { id: repoId },
            { name: repoId }
          ]
        },
        include: { dataset: true },
      });
    }

    if (!foundRepo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }
    const repo = foundRepo;

    const latestRun = await prisma.enrichmentRun.findFirst({
      where: { repoId: repo.id },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json({
      repoId: repo.id,
      lastEnrichedAt: repo.lastEnrichedAt,
      lastEnrichmentStatus: repo.lastEnrichmentStatus,
      memoryScore: repo.memoryScore,
      datasetQualityScore: repo.dataset?.qualityScore ?? 0,
      latestRun,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
