import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cogneeRecall } from "@/lib/cognee-client";
import { recordRecallHits } from "@/server/jobs/enrichment-job";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await params;
    const body = await req.json();
    const query = body.query || "Prisma transitions";

    let dbRepo = await prisma.repository.findFirst({
      where: {
        OR: [
          { id: repoId },
          { fullName: repoId.replace("-", "/") },
          { name: repoId }
        ]
      }
    });

    let recalledNodeIds: string[] = [];
    
    if (dbRepo?.datasetName) {
      try {
        const results = await cogneeRecall(query, {
          datasets: [dbRepo.datasetName],
          searchType: "GRAPH_COMPLETION",
          topK: 5,
        });

        results.forEach((r: any) => {
          if (r.metadata?.id) {
            recalledNodeIds.push(r.metadata.id);
          } else if (r.raw?.id) {
            recalledNodeIds.push(r.raw.id);
          }
        });

        await recordRecallHits(dbRepo.id, recalledNodeIds);
      } catch (err) {
        console.warn("cogneeRecall failed in recall route, using fallback tracer", err);
      }
    }

    // Fallback: select 3 random nodes from database if empty
    if (recalledNodeIds.length === 0 && dbRepo) {
      const prs = await prisma.pullRequest.findMany({ where: { repoId: dbRepo.id, stale: false }, take: 2 });
      prs.forEach(pr => recalledNodeIds.push(pr.id));
      const commits = await prisma.commit.findMany({ where: { repoId: dbRepo.id, stale: false }, take: 1 });
      commits.forEach(c => recalledNodeIds.push(c.id));

      await recordRecallHits(dbRepo.id, recalledNodeIds);
    }

    return NextResponse.json({ success: true, recalledNodeIds });
  } catch (error: any) {
    console.error("Recall route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
